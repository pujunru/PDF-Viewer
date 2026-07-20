/**
 * Shared surface for the per-tab viewer document.
 *
 * Both platforms host the identical viewer.html and speak the identical
 * message protocol; only the container differs (WebView vs iframe). The
 * bundler picks PdfViewport.native.tsx or PdfViewport.web.tsx via platform
 * extensions — this file only declares the contract they both satisfy.
 */
import type {ViewerMessage} from '@pdf-viewer/core';

export type PdfViewportProps = {
  /** URL of the viewer document to host. */
  source: string;
  /** Whether this tab is the visible one (inactive tabs stay mounted). */
  visible: boolean;
  onMessage: (m: ViewerMessage) => void;
};

export type PdfViewportHandle = {
  /** Send a shell message to this tab's viewer. */
  post: (type: string, payload?: unknown) => void;
};

export type {ViewerMessage};

// The concrete implementations live in PdfViewport.native.tsx / .web.tsx.
export declare const PdfViewport: React.ForwardRefExoticComponent<
  PdfViewportProps & React.RefAttributes<PdfViewportHandle>
>;
