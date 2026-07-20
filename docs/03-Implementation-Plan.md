# Implementation Plan — Pure PDF Viewer

**Version:** 1.0
**Date:** 2026-07-17
**Companion to:** 01-PDD.md, 02-HLD.md

---

## 0. Approach

Build **inside-out**: prove the two riskiest boundaries first — (a) the RN↔WebView
bridge on both desktop OSes, and (b) pdf.js rendering + save inside that WebView —
before building UI polish. Each phase ends in something runnable.

Legend: **[Spike]** = de-risking prototype, throwaway-ok · **[Core]** = shipped code.

---

## Phase 0 — Project setup (0.5 day)
- [ ] Init `react-native-macos` app; add `react-native-windows` target.
- [ ] TypeScript + ESLint/Prettier; folder layout (`shell/`, `webview/`, `native/`, `docs/`).
- [ ] Confirm both platforms build & run an empty window.
- **Exit:** blank app launches on macOS and Windows.

## Phase 1 — WebView + bridge spike (1–1.5 days) **[Spike → Core]**
- [ ] Add a WebView package; render a local HTML asset in it on both OSes (OQ-1/OQ-2).
- [ ] Implement typed `bridge` (postMessage) — round-trip a `PING/PONG`.
- [ ] Load pdf.js into the WebView; render a bundled sample PDF's first page.
- **Exit:** a PDF page renders inside RN on macOS **and** Windows; bridge round-trips.

## Phase 2 — Native file services (1 day) **[Core]**
- [ ] `nativeFile.open()` → native dialog → bytes + path (per-platform native module).
- [ ] `nativeFile.save()/saveAs()` → dialog + **atomic** write (temp → replace).
- [ ] Drag-and-drop a file onto the window → open it.
- **Exit:** open a user-chosen PDF from disk; write bytes back safely.

## Phase 3 — Single-document viewer (1.5 days) **[Core]**
- [ ] Boot pdf.js `PDFViewer` + `EventBus`; continuous scroll, all pages.
- [ ] Text layer enabled (needed for search + text markup).
- [ ] Zoom in/out, fit-to-width, page counter / go-to-page.
- [ ] `LOAD_DOCUMENT` / `DOCUMENT_LOADED` bridge messages.
- **Exit:** open and read any PDF end-to-end with zoom + navigation.

## Phase 4 — Search (0.5–1 day) **[Core]**
- [ ] Wire `PDFFindController`; `SEARCH{query,dir}` → `SEARCH_RESULT{current,total}`.
- [ ] Toolbar search box, Next/Prev, "n / m" count, current-match highlight.
- **Exit:** find + navigate matches in a document.

## Phase 5 — Built-in annotations: highlight / scribble / free text (1.5 days) **[Core]**
- [ ] Drive `annotationEditorMode` for `HIGHLIGHT`, `INK`, `FREETEXT`.
- [ ] `SET_TOOL{type,color}`; color palette in toolbar (OQ-3).
- [ ] Emit `DIRTY` on any annotation change → tab `*`.
- [ ] Select + delete an annotation.
- **Exit:** highlight, scribble, and free-text tools work and mark the tab dirty.

## Phase 6 — Custom annotations: underline / strikeout (1 day) **[Core]**
- [ ] `textmark` module: on text selection, capture client rects → normalized coords.
- [ ] Draw overlay rects (under = baseline strip; strike = mid strip) in chosen color.
- [ ] Hit-test + delete; re-project on zoom.
- **Exit:** underline and strikeout selected text; survive zoom.

## Phase 7 — Save (embed into PDF) (1.5 days) **[Core]**
- [ ] `save` module: original bytes → pdf.js editor serialization + pdf-lib.
- [ ] Write `/Highlight`, `/Underline`, `/StrikeOut`, `/Ink`, `/FreeText` objects.
- [ ] Return bytes → `nativeFile.save` (atomic).
- [ ] **Validate** output opens correctly in this app **and** a third-party viewer (SC-2).
- **Exit:** save → reopen (here + Preview/Acrobat) shows all annotations. Clears dirty.

## Phase 8 — Tabs (1 day) **[Core]**
- [ ] `TabBar`: open multiple docs, switch, close; one WebView per tab.
- [ ] Dirty `*` per tab; confirm-save on close/quit with unsaved changes.
- [ ] Lazy-mount inactive tabs' WebViews if perf requires.
- **Exit:** 3 PDFs open in tabs; independent state; safe close.

## Phase 9 — Hardening & polish (1–1.5 days)
- [ ] Error states: corrupt / encrypted / large PDFs (HLD §7).
- [ ] Keyboard shortcuts: open, save, find, zoom, next/prev match.
- [ ] Window size/pos persistence.
- [ ] Cross-platform parity pass (macOS ↔ Windows).
- **Exit:** SC-1/SC-2/SC-3 pass on both OSes.

---

## Milestones
| M | Content | ~Cumulative |
|---|---------|-------------|
| M1 — Renders in RN | Phases 0–1 | ~2.5 d |
| M2 — Usable viewer | + 2–4 | ~5.5 d |
| M3 — Annotates & saves | + 5–7 | ~9.5 d |
| M4 — Feature complete | + 8–9 | ~12 d |

_Estimates are for one experienced RN+web engineer; RN-desktop unknowns (Phase 1) are the main variance driver._

---

## Testing Strategy
- **Unit:** bridge serialization; coordinate normalization; save-model mapping.
- **Integration (in WebView):** load → annotate → save → reload round-trip per annotation type.
- **Cross-viewer:** saved files verified in Preview (macOS) + Acrobat/another reader.
- **Manual matrix:** every feature on macOS and Windows (parity checklist).
- **Stress:** 50-save loop on one file → no corruption (SC-3); 300-page scroll perf.

## Definition of Done
- All PDD functional requirements (FR-1…FR-19) met on both OSes.
- Success criteria SC-1…SC-3 pass.
- No source-PDF corruption; saves are atomic.
- Docs updated; open questions OQ-1…OQ-3 resolved and recorded.

---

## Dependencies / Watch-list
- WebView package stability on RN-macOS **and** RN-windows (Phase 1 spike gates the plan).
- pdf.js version pin (annotation editor API is version-sensitive).
- pdf-lib annotation coverage for ink/free-text portability (validate in Phase 7).
