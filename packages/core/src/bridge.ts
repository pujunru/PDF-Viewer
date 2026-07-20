/**
 * The shell <-> viewer message protocol.
 *
 * The viewer document is the same code on every platform; only the transport
 * differs. On macOS the shell talks to a react-native-webview
 * (`ReactNativeWebView.postMessage`); on web it talks to an <iframe>
 * (`contentWindow.postMessage`). Both sides speak the message types below, so
 * the viewer never needs to know which shell is hosting it.
 */
import type {Tool} from './types';

/** Shell -> viewer. */
export type ShellMessage =
  | {type: 'load'; payload: {base64: string}}
  | {type: 'setTool'; payload: {tool: Tool; color: string}}
  | {type: 'setColor'; payload: {color: string}}
  | {type: 'setFontSize'; payload: {size: number}}
  | {type: 'search'; payload: {term: string}}
  | {type: 'searchStep'; payload: {dir: 1 | -1}}
  | {type: 'zoomIn'; payload?: {}}
  | {type: 'zoomOut'; payload?: {}}
  | {type: 'save'; payload?: {}}
  | {type: 'ping'; payload?: {}};

/** Viewer -> shell. */
export type ViewerMessage =
  | {type: 'ready'; payload: {}}
  | {type: 'loaded'; payload: {pageCount: number}}
  | {type: 'dirty'; payload: {dirty: boolean}}
  | {type: 'search'; payload: {current: number; total: number}}
  | {type: 'zoom'; payload: {scale: number}}
  /** A text box gained or lost selection; carries its style so the panel can
   *  show what its controls are about to change. */
  | {
      type: 'textSelection';
      payload: {selected: boolean; color: string | null; size: number | null};
    }
  | {type: 'error'; payload: {message: string}}
  | {type: 'annotations'; payload: unknown}
  | {type: 'pong'; payload: {}};

/** Parse a raw transport payload into a viewer message, or null if it isn't one. */
export function parseViewerMessage(data: unknown): ViewerMessage | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    const m = JSON.parse(data);
    return m && typeof m.type === 'string' ? (m as ViewerMessage) : null;
  } catch {
    return null;
  }
}

export function encodeShellMessage(type: string, payload: unknown = {}): string {
  return JSON.stringify({type, payload});
}

/**
 * What a shell must provide to open and persist documents. macOS implements
 * this over NSOpenPanel/NSSavePanel through a native module; web implements it
 * over the File System Access API (with an <input type=file> fallback).
 */
export interface FileService {
  /** Present a picker. Resolves null if the user cancels. */
  openPDF(): Promise<PickedFile | null>;
  /** Overwrite the document in place. */
  saveBytes(handle: SaveTarget, base64: string): Promise<boolean>;
  /** Present a save dialog. Resolves null if the user cancels. */
  saveAsPDF(suggestedName: string, base64: string): Promise<SavedFile | null>;
}

export type PickedFile = {
  name: string;
  /** macOS: filesystem path. Web: the file name (no path exists). */
  path: string;
  base64: string;
  /**
   * Web only: the FileSystemFileHandle that lets a later save write back to
   * the same file without re-prompting. Undefined on macOS, where `path` is
   * sufficient.
   */
  handle?: unknown;
};

export type SaveTarget = string | {handle: unknown};
export type SavedFile = {path: string; name: string; handle?: unknown};
