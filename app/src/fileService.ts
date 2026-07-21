/**
 * Native implementation of FileService. macOS and Windows expose the same
 * FilePicker contract using their platform file dialogs and storage APIs.
 */
import {NativeModules} from 'react-native';
import type {FileService, PickedFile, SaveTarget, SavedFile} from '@pdf-viewer/core';

const {FilePicker} = NativeModules;

export const nativeFileService: FileService = {
  async openPDF(): Promise<PickedFile | null> {
    if (!FilePicker?.openPDF) {
      return null;
    }
    // The native side resolves null when the user cancels the panel.
    return (await FilePicker.openPDF()) ?? null;
  },

  async saveBytes(target: SaveTarget, base64: string): Promise<boolean> {
    // Native documents are addressed by an opaque string (a filesystem path
    // on macOS and a StorageFile token on Windows).
    const path = typeof target === 'string' ? target : '';
    if (!path || !FilePicker?.saveBytes) {
      return false;
    }
    return await FilePicker.saveBytes(path, base64);
  },

  async saveAsPDF(suggestedName: string, base64: string): Promise<SavedFile | null> {
    if (!FilePicker?.saveAsPDF) {
      return null;
    }
    return (await FilePicker.saveAsPDF(suggestedName, base64)) ?? null;
  },
};
