/**
 * Web implementation of FileService, over the File System Access API.
 *
 * Where macOS gets NSOpenPanel/NSSavePanel through a native module, the browser
 * offers showOpenFilePicker/showSaveFilePicker — which additionally hand back a
 * FileSystemFileHandle, so a later save can write to the same file without
 * re-prompting (the web equivalent of macOS holding a path).
 *
 * Safari and Firefox do not implement the picker API, so both paths fall back
 * to a hidden <input type="file"> for opening and an <a download> for saving.
 * The fallback cannot write in place, so saving there always behaves as
 * "save as" (a download), which is the only thing the platform permits.
 */
import type {FileService, PickedFile, SaveTarget, SavedFile} from '@pdf-viewer/core';

const PDF_TYPES = [{description: 'PDF document', accept: {'application/pdf': ['.pdf']}}];

const hasPicker = () => typeof (window as any).showOpenFilePicker === 'function';
const hasSavePicker = () => typeof (window as any).showSaveFilePicker === 'function';

/**
 * Chunked so a large PDF does not blow the argument limit: String.fromCharCode
 * takes each byte as its own argument, and a multi-megabyte spread overflows
 * the call stack.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function readAsPicked(file: File, handle?: unknown): Promise<PickedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    name: file.name || 'document.pdf',
    // The browser exposes no filesystem path; the name is what the shell shows,
    // and `handle` is what actually addresses the file for writing.
    path: file.name || '',
    base64: bytesToBase64(bytes),
    handle,
  };
}

/** Fallback picker for browsers without showOpenFilePicker. */
function pickViaInput(): Promise<PickedFile | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    // A cancelled dialog fires no event in most browsers; 'cancel' is the
    // standardised signal, and the focus fallback covers browsers without it.
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      resolve(file ? await readAsPicked(file) : null);
    });
    input.click();
  });
}

export const webFileService: FileService = {
  async openPDF(): Promise<PickedFile | null> {
    if (!hasPicker()) {
      return pickViaInput();
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: PDF_TYPES,
        multiple: false,
      });
      return await readAsPicked(await handle.getFile(), handle);
    } catch (err: any) {
      // The picker rejects with AbortError when the user dismisses it — that
      // is a cancel, not a failure.
      if (err?.name === 'AbortError') {
        return null;
      }
      throw err;
    }
  },

  async saveBytes(target: SaveTarget, base64: string): Promise<boolean> {
    const handle = typeof target === 'object' ? (target.handle as any) : null;
    if (!handle?.createWritable) {
      return false; // no in-place write available; caller should saveAs instead
    }
    const writable = await handle.createWritable();
    await writable.write(base64ToBytes(base64));
    await writable.close();
    return true;
  },

  async saveAsPDF(suggestedName: string, base64: string): Promise<SavedFile | null> {
    const bytes = base64ToBytes(base64);
    if (hasSavePicker()) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: suggestedName || 'document.pdf',
          types: PDF_TYPES,
        });
        const writable = await handle.createWritable();
        await writable.write(bytes);
        await writable.close();
        return {path: handle.name, name: handle.name, handle};
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return null;
        }
        throw err;
      }
    }
    // Fallback: hand the bytes to the browser's download flow. There is no way
    // to learn where the user put it, so the reported path is just the name.
    const name = suggestedName || 'document.pdf';
    const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return {path: name, name};
  },
};
