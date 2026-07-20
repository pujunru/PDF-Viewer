# Product Definition Document (PDD) — Pure PDF Viewer

**Version:** 1.0
**Date:** 2026-07-17
**Status:** Draft for review

---

## 1. Summary

A lightweight, cross-platform (macOS + Windows) **desktop** PDF viewer built with
**React Native for macOS/Windows**, using **Mozilla pdf.js** for rendering. The app
lets a user open multiple PDFs in **tabs**, read them, **search** within a document,
and apply **basic annotations** (highlight, underline, strikeout, freehand scribble,
and free text). Annotations are saved **back into the PDF file** so they are portable
to any standards-compliant reader.

This is a **viewer + light markup** tool. It is explicitly **not** a PDF editor:
no page reordering, no content editing, no form authoring, no merge/split.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- G1 — Open and render PDF files faithfully on macOS and Windows.
- G2 — Multi-document **tabbed** interface.
- G3 — In-document **text search** with match navigation.
- G4 — Basic annotation toolset: **highlight, underline, strikeout, scribble (ink), free text**.
- G5 — **Persist annotations embedded in the PDF** (portable, standards-based).
- G6 — Single React Native codebase shared across both desktop platforms.
- G7 — Reuse pdf.js's built-in capabilities wherever they exist (DRY).

### 2.2 Non-Goals
- N1 — No mobile (iOS/Android) target in v1.
- N2 — No PDF content editing (text, images, pages).
- N3 — No form filling, digital signatures, or redaction.
- N4 — No cloud sync, accounts, or collaboration.
- N5 — No OCR / scanned-document text recognition.
- N6 — No merge, split, rotate, or export-to-other-formats.

---

## 3. Target Users & Use Cases

**Primary user:** Someone reading technical/reference PDFs (e.g. lecture slides,
papers, manuals) who wants to mark them up lightly while reading.

| # | Use case |
|---|----------|
| U1 | Open several PDFs and switch between them via tabs. |
| U2 | Read/scroll a document at a comfortable zoom. |
| U3 | Search for a term and jump between matches. |
| U4 | Highlight a passage. |
| U5 | Underline or strike out selected text. |
| U6 | Draw a freehand scribble on the page. |
| U7 | Drop a free-text note on the page. |
| U8 | Save marked-up PDF and reopen it (in this app or another viewer) with annotations intact. |

---

## 4. Functional Requirements

### 4.1 Document Management
- FR-1 Open a PDF via native file-open dialog and via drag-and-drop onto the window.
- FR-2 Display each open document in its own **tab** (title = filename; `*` marks unsaved changes).
- FR-3 Close a tab; prompt to save if there are unsaved annotations.
- FR-4 Remember last window size/position (nice-to-have).

### 4.2 Rendering & Navigation
- FR-5 Continuous vertical scroll of all pages.
- FR-6 Zoom in/out and fit-to-width; page counter / go-to-page.
- FR-7 Render selectable **text layer** (required for search + text-anchored annotations).

### 4.3 Search
- FR-8 Search box; find all matches in the current document.
- FR-9 Next/previous match navigation; highlight current match; show match count.

### 4.4 Annotation
- FR-10 **Highlight** selected text.
- FR-11 **Underline** selected text.
- FR-12 **Strikeout** selected text.
- FR-13 **Scribble (ink)** — freehand pen drawing.
- FR-14 **Free text** — click to place an editable text box.
- FR-15 Choose a color (small preset palette) for annotations.
- FR-16 Select an existing annotation and delete it.

### 4.5 Persistence
- FR-17 **Save** writes annotations into the PDF as standard PDF annotation objects.
- FR-18 Save As to a new path.
- FR-19 Reopened saved files show the annotations correctly, including in third-party viewers.

---

## 5. Non-Functional Requirements
- NFR-1 **Cross-platform parity:** identical feature set and UX on macOS and Windows.
- NFR-2 **Performance:** smooth scroll and interaction on documents up to ~300 pages; lazy page rendering.
- NFR-3 **Reliability:** never corrupt the source PDF; save is atomic (write temp → replace).
- NFR-4 **Privacy:** fully offline; no network calls, no telemetry.
- NFR-5 **Maintainability:** shared RN codebase; pdf.js isolated behind one integration boundary.
- NFR-6 **Accessibility:** keyboard shortcuts for open/save/search/zoom.

---

## 6. Assumptions & Constraints
- A1 — Target stack: **react-native-macos** + **react-native-windows** (per stakeholder decision).
- A2 — pdf.js runs inside a **WebView** (it is a web/DOM library; RN desktop has no DOM).
- A3 — Annotation model uses pdf.js's built-in editors where they exist (**Ink, FreeText, Highlight**),
  plus a **thin custom layer** for **underline/strikeout**, which pdf.js does not offer as
  creation tools. See HLD §4.
- A4 — Save-to-PDF uses a PDF-writing library (**pdf-lib**) inside the same WebView.
- A5 — English-only UI in v1.

---

## 7. Success Criteria
- SC-1 A user can open 3 PDFs in tabs, search, apply all five annotation types, save, and reopen
  with everything intact on both macOS and Windows.
- SC-2 Saved files render annotations correctly in at least one third-party viewer (e.g. Preview / Acrobat).
- SC-3 No source-file corruption across a 50-save stress test.

---

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| RN-macOS/Windows maturity gaps (WebView bridge, file APIs) | High | Isolate native calls behind a small platform module; prototype the WebView↔RN bridge first (spike). |
| pdf.js viewer lacks underline/strikeout creation | Medium | Build thin custom text-anchored overlay for those two (cheap given the text layer). |
| Embedding annotations portably (esp. ink/free text) | Medium | Use pdf-lib + validate output in third-party viewers early. |
| Large-document performance in a WebView | Medium | Lazy render visible pages only; reuse pdf.js viewer's virtualization. |
