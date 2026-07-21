/**
 * PDF Viewer — macOS and Windows entry point.
 *
 * The shell, its components and its styles all live in the shared packages and
 * are identical to the web build. This file supplies only what is native: the
 * platform file service and the URL of the viewer document in the app bundle.
 */
import React from 'react';
import {NativeModules, Platform} from 'react-native';
import App from '@pdf-viewer/ui/src/App';
import {nativeFileService} from './src/fileService';

// Windows serves the packaged viewer assets to the Chromium WebView2 through a
// virtual host mapped to the install folder (see the react-native-webview
// SetVirtualHostNameToFolderMapping patch); ms-appx-web:// only works on the
// deprecated EdgeHTML WebView. macOS resolves the copied resource through
// BundleResources.
const {BundleResources} = NativeModules;
const VIEWER_URL: string =
  Platform.OS === 'windows'
    ? 'https://assets.pdfviewer/Assets/pdfjs/viewer.windows.html'
    : (BundleResources && BundleResources.viewerURL) || '';

if (__DEV__) {
  console.log('[PDF Viewer] viewer URL:', VIEWER_URL || '<missing>');
}

export default function Root(): React.JSX.Element {
  return <App files={nativeFileService} viewerUrl={VIEWER_URL} />;
}
