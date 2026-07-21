import {defineConfig, normalizePath} from 'vite';
import react from '@vitejs/plugin-react';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/, not the domain root, so
  // asset URLs need that prefix. Left as '/' for local dev and any root-served
  // deploy; the Pages workflow sets BASE_PATH. main.tsx builds the viewer URL
  // from import.meta.env.BASE_URL, so it follows this automatically.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    // The viewer document is served verbatim, with its pdf.js siblings beside
    // it, so its relative imports resolve the same way they do inside the
    // macOS app bundle. Copying (rather than importing) keeps the shared
    // package byte-identical across platforms.
    viteStaticCopy({
      targets: [
        {
          // fast-glob expects POSIX separators even when Vite runs on Windows.
          src: normalizePath(path.join(repoRoot, 'packages/viewer/src/*')),
          dest: 'viewer',
        },
      ],
    }),
  ],
  resolve: {
    // This alias is what makes "write the UI once" real: every component in
    // @pdf-viewer/ui imports from 'react-native', and on web those imports
    // land on react-native-web.
    alias: {
      'react-native': 'react-native-web',
    },
    // RN's platform-extension convention, taught to Vite: PdfViewport.web.tsx
    // wins over PdfViewport.tsx here, the way .native.tsx does under Metro.
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.web.js', '.jsx', '.js', '.json'],
  },
  define: {
    // react-native-web reads __DEV__ the way the native runtime does.
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
  },
  optimizeDeps: {
    // The workspace packages ship untranspiled TSX; esbuild must see them as
    // source rather than treating them as prebundled CommonJS deps.
    exclude: ['@pdf-viewer/core', '@pdf-viewer/styles', '@pdf-viewer/ui'],
    esbuildOptions: {resolveExtensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js']},
  },
  server: {port: 5173},
});
