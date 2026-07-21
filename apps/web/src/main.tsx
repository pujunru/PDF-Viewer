/**
 * Web entry point. Everything visible is the shared shell — this file only
 * supplies the two platform pieces: how files are picked, and where the viewer
 * document is served from.
 */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AppRegistry} from 'react-native';
import App from '@pdf-viewer/ui/src/App';
import {webFileService} from './fileService';

// The viewer document and its pdf.js assets are copied to /viewer/ at build
// time (see vite.config.ts), so its relative imports — ./build/pdf.mjs,
// ./web/cmaps/, ./sample.pdf — resolve exactly as they do in the app bundle.
const VIEWER_URL = `${import.meta.env.BASE_URL}viewer/viewer.html`;

function Root() {
  return <App files={webFileService} viewerUrl={VIEWER_URL} />;
}

// Registering through AppRegistry (rather than rendering directly) lets
// react-native-web inject the style sheet it generates from StyleSheet.create.
AppRegistry.registerComponent('PDFViewer', () => Root);

const root = document.getElementById('root')!;
AppRegistry.runApplication('PDFViewer', {rootTag: root});

export {createRoot}; // keep react-dom in the graph for RNW's renderer
