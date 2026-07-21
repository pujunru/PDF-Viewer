# High-Level Design (HLD) — PDF Viewer

**Version:** 1.0
**Date:** 2026-07-17
**Companion to:** 01-PDD.md

---

## 1. Architecture Overview

The app is a **React Native for macOS/Windows** shell that hosts **pdf.js inside a
single WebView per tab**. React Native owns the OS-level concerns (windowing, tabs,
menus, native file dialogs, reading/writing bytes). pdf.js — a DOM library — owns
everything inside the page: rendering, the text layer, search, and annotation editing.
The two halves talk over a **typed JSON message bridge**.

```
┌───────────────────────────────────────────────────────────────┐
│  React Native (macOS / Windows)  —  the app shell              │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ TabBar       │  │ Toolbar      │  │ Native services       │ │
│  │ (open/close) │  │ (tools,      │  │ • File open/save dlg  │ │
│  │              │  │  search,     │  │ • Read/write bytes    │ │
│  │              │  │  zoom, color)│  │ • Drag-and-drop       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │  app state (tabs, active tool, dirty)  │             │
│         └───────────────┬─────────────────────────┘           │
│                         │  RN↔WebView JSON bridge (postMessage)│
│  ┌──────────────────────┼──────────────────────────────────┐  │
│  │  WebView  (one per open document)                        │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  pdf.js engine                                     │  │  │
│  │  │   • getDocument / render pages (canvas)            │  │  │
│  │  │   • text layer (selection + search)                │  │  │
│  │  │   • find controller (search)                       │  │  │
│  │  │   • AnnotationEditorLayer: INK, FREETEXT, HIGHLIGHT│  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │  Custom overlay layer                              │  │  │
│  │  │   • UNDERLINE / STRIKEOUT (text-anchored rects)    │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │  Save module (pdf-lib): merge all annotations →    │  │  │
│  │  │  standard PDF annotation objects → bytes           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### DRY decision (pdf.js reuse)
pdf.js's prebuilt annotation editor supports `AnnotationEditorType`:
`NONE`, `DISABLE`, `FREETEXT`, `HIGHLIGHT`, `INK`, `STAMP`. It has **no creation tool for
underline or strikeout**. Therefore:

| Tool | Implementation |
|------|----------------|
| Highlight | **pdf.js built-in** `HIGHLIGHT` editor |
| Scribble | **pdf.js built-in** `INK` editor |
| Free text | **pdf.js built-in** `FREETEXT` editor |
| Underline | **Custom** overlay: rectangles under selected text runs |
| Strikeout | **Custom** overlay: rectangles through selected text runs |

Underline/strikeout are cheap because pdf.js already exposes per-glyph geometry via
the text layer; the custom layer just draws thin rects over the selection's client rects
and records their normalized page coordinates.

---

## 2. Component Breakdown

### 2.1 React Native shell (JS/TS)
| Component | Responsibility |
|-----------|----------------|
| `App` | Root; holds global state (tab list, active tab, active tool, color). |
| `TabBar` | Render tabs, switch/close, dirty indicator. |
| `Toolbar` | Tool selection, color picker, zoom, page nav, search box. |
| `DocumentView` | Wraps one `WebView`; mounts pdf.js; routes bridge messages. |
| `bridge` | Typed send/receive over `postMessage`; request/response + events. |
| `nativeFile` | Native module: open dialog, save dialog, read/write bytes, DnD. |
| `store` | App state (Zustand/Redux-lite). Persists window prefs. |

### 2.2 WebView side (pdf.js host — plain TS bundled to one HTML)
| Module | Responsibility |
|--------|----------------|
| `viewer` | Boots pdf.js `PDFViewer` + `EventBus` + `PDFFindController`. |
| `annotations/builtin` | Drives `annotationEditorMode` for INK/FREETEXT/HIGHLIGHT. |
| `annotations/textmark` | Custom underline/strikeout overlay + hit-testing/delete. |
| `search` | Wraps find controller; reports match count / current index. |
| `save` | Collects built-in + custom annotations, writes via **pdf-lib**, returns bytes. |
| `rpc` | Bridge endpoint inside the page. |

---

## 3. Key Data Flows

### 3.1 Open a document
1. User picks a file (dialog or drag-drop) → `nativeFile` returns bytes + path.
2. Shell creates a tab and a `DocumentView` with a fresh WebView.
3. Shell sends `LOAD_DOCUMENT{bytes}` over the bridge.
4. WebView `viewer` renders; emits `DOCUMENT_LOADED{pageCount}`.

### 3.2 Search
1. Toolbar → `SEARCH{query, dir}` → WebView `search`.
2. pdf.js find controller runs → emits `SEARCH_RESULT{current, total}`.
3. Shell shows "3 / 12"; Next/Prev send `SEARCH{dir}`.

### 3.3 Annotate (built-in tool, e.g. highlight)
1. Toolbar sets active tool → `SET_TOOL{HIGHLIGHT, color}`.
2. WebView sets `annotationEditorMode`; pdf.js handles the gesture.
3. On change, WebView emits `DIRTY{true}` → shell shows `*` on the tab.

### 3.4 Annotate (custom underline/strikeout)
1. Toolbar sets tool → `SET_TOOL{UNDERLINE, color}`.
2. User selects text; `textmark` reads selection rects, draws overlay, stores
   normalized coords → emits `DIRTY{true}`.

### 3.5 Save (embed into PDF)
1. Shell → `SAVE`.
2. WebView `save`: get original bytes → let pdf.js serialize its editor annotations →
   load into **pdf-lib** → add underline/strikeout as PDF markup annotations →
   return updated bytes.
3. Shell `nativeFile` writes atomically (temp file → replace) → clears dirty flag.

---

## 4. Annotation & Persistence Model

- **In-memory:** built-in annotations live in pdf.js's editor state; custom
  underline/strikeout live in a small array of `{page, color, rects[], type}` with
  **normalized (0–1) page coordinates** so they survive zoom/reflow.
- **On disk:** everything is written as **standard PDF annotation objects**:
  - Highlight/Underline/StrikeOut → PDF text-markup annotations (`/Highlight`, `/Underline`, `/StrikeOut`) with quad points.
  - Ink → `/Ink` annotation with ink lists.
  - Free text → `/FreeText` annotation.
- This makes saved files portable to Preview, Acrobat, etc. (SC-2).

---

## 5. Cross-Platform Strategy
- One RN codebase; `react-native-macos` + `react-native-windows`.
- Native differences (file dialogs, byte I/O, drag-drop) hidden behind the
  `nativeFile` module with a per-platform native implementation and one JS interface.
- The entire pdf.js layer is **platform-agnostic** (it's just web content in a WebView),
  so ~90% of logic is shared and identical across OSes.

---

## 6. Technology Choices

| Concern | Choice | Why |
|---------|--------|-----|
| App shell | react-native-macos / windows | Stakeholder-selected; true RN desktop. |
| PDF render/search/annotate | pdf.js | Mature, offline, reuses built-in editors (DRY). |
| Host container | WebView (per tab) | pdf.js needs a DOM. |
| Save/write PDF | pdf-lib | Pure-JS PDF writer; runs in the WebView; embeds standard annotations. |
| State | Zustand (or minimal Redux) | Small, simple app state. |
| Language | TypeScript | Type-safe bridge contract on both sides. |

---

## 7. Error Handling & Edge Cases
- Corrupt/unsupported PDF → tab shows an error state, not a crash.
- Encrypted PDF → prompt for password (if pdf.js reports it); else show "protected".
- Close tab / quit with unsaved changes → confirm-save prompt.
- Save failure (disk/permission) → keep dirty flag, surface error, never touch original until temp write succeeds.
- Very large PDFs → rely on pdf.js virtualization; only render visible pages.

---

## 8. Open Questions
- OQ-1 Which WebView package is most stable on both RN-macOS and RN-windows? (spike).
- OQ-2 Bundle pdf.js/pdf-lib as local assets vs. inline — asset loading differs per platform.
- OQ-3 Preset color palette contents and default.
