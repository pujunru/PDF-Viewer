/**
 * macOS implementation of FileService, over the native FilePicker module
 * (NSOpenPanel / NSSavePanel, with atomic temp-then-replace writes).
 */
import {NativeModules} from 'react-native';
import type {FileService, PickedFile, SaveTarget, SavedFile} from '@pdf-viewer/core';

const {FilePicker} = NativeModules;

export const macFileService: FileService = {
  async openPDF(): Promise<PickedFile | null> {
    if (!FilePicker?.openPDF) {
      return null;
    }
    // The native side resolves null when the user cancels the panel.
    return (await FilePicker.openPDF()) ?? null;
  },

  async saveBytes(target: SaveTarget, base64: string): Promise<boolean> {
    // On macOS a document is addressed by its filesystem path; the web-only
    // handle form of SaveTarget never occurs here.
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
