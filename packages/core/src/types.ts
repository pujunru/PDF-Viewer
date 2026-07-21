/** Domain types shared by every shell. */

export type Tool = 'none' | 'highlight' | 'underline' | 'strikeout' | 'ink' | 'freetext';

export type Tab = {
  id: string;
  title: string;
  dirty: boolean;
  pageCount: number;
  ready: boolean;
  /**
   * Where the document came from. It is a filesystem path on macOS, an opaque
   * StorageFile token on Windows, and a picked-file name on web. The shell does
   * not dereference it; it distinguishes "save" from "save as".
   */
  path: string | null;
  /** Bytes waiting for the viewer to signal ready. */
  pendingBase64: string | null;
  zoomPct: number;
};

/** The viewer's baseline render scale (1.2) is defined as 100% zoom. */
export const BASE_SCALE = 1.2;

/** The sentinel the viewer understands as "fetch the bundled ./sample.pdf". */
export const SAMPLE_DOC = '@sample';

export const TOOLS: {key: Tool; icon: string; label: string}[] = [
  {key: 'highlight', icon: 'A', label: 'Highlight'},
  {key: 'underline', icon: 'A', label: 'Underline'},
  {key: 'strikeout', icon: 'A', label: 'Strikethrough'},
  {key: 'ink', icon: '✎', label: 'Scribble'},
  {key: 'freetext', icon: 'T', label: 'Add Text'},
];

/** How a tool's glyph previews its own effect in the toolbar. */
export function markForTool(tool: Tool): 'fill' | 'under' | 'through' | undefined {
  switch (tool) {
    case 'highlight':
      return 'fill';
    case 'underline':
      return 'under';
    case 'strikeout':
      return 'through';
    default:
      return undefined;
  }
}

let counter = 0;
export const newId = () => `tab-${++counter}`;

export function newTab(init: Partial<Tab> = {}): Tab {
  return {
    id: newId(),
    title: 'sample.pdf',
    dirty: false,
    pageCount: 0,
    ready: false,
    path: null,
    pendingBase64: null,
    zoomPct: 100,
    ...init,
  };
}
