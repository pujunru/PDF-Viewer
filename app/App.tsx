/**
 * Pure PDF Viewer — macOS entry point.
 *
 * The shell, its components and its styles all live in the shared packages and
 * are identical to the web build. This file supplies only what is native: the
 * NSOpenPanel/NSSavePanel-backed file service, and the file:// URL of the
 * viewer document inside the app bundle.
 */
import React from 'react';
import {NativeModules} from 'react-native';
import App from '@pdf-viewer/ui/src/App';
import {macFileService} from './src/fileService';

// Native constant: file:// URL to the bundled pdf.js viewer. It is loaded from
// the bundle so its siblings — build/*.mjs, web/*, sample.pdf — resolve via
// relative URLs.
const {BundleResources} = NativeModules;
const VIEWER_URL: string = (BundleResources && BundleResources.viewerURL) || '';

export default function Root(): React.JSX.Element {
  return <App files={macFileService} viewerUrl={VIEWER_URL} />;
}
