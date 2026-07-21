#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// RNW 0.76's UWP WebView surface runs on the legacy EdgeHTML (Chakra) engine.
// esbuild's `es2017` target lowers newer *syntax* but never adds runtime
// polyfills for newer built-in *methods*, so anything pdf.js relies on beyond
// ES2017 (e.g. `Array.prototype.at`) throws "Object doesn't support property or
// method" at runtime. Prepend these polyfills to every bundle we emit (main
// thread and worker) so both execution contexts are covered.
const LEGACY_ENGINE_POLYFILLS = `(function () {
  var def = function (target, name, value) {
    if (target && typeof target[name] !== 'function') {
      Object.defineProperty(target, name, {
        value: value,
        writable: true,
        configurable: true,
      });
    }
  };
  var at = function (index) {
    var len = this.length >>> 0;
    var i = Math.trunc(index) || 0;
    if (i < 0) i += len;
    return i < 0 || i >= len ? undefined : this[i];
  };
  def(Array.prototype, 'at', at);
  def(String.prototype, 'at', at);
  var TypedArray = Object.getPrototypeOf(Int8Array.prototype);
  if (TypedArray && TypedArray !== Object.prototype) {
    def(TypedArray, 'at', at);
  }
  if (typeof Object.hasOwn !== 'function') {
    Object.defineProperty(Object, 'hasOwn', {
      value: function (obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      },
      writable: true,
      configurable: true,
    });
  }
  def(Array.prototype, 'findLast', function (predicate, thisArg) {
    for (var i = (this.length >>> 0) - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return this[i];
    }
    return undefined;
  });
  def(Array.prototype, 'findLastIndex', function (predicate, thisArg) {
    for (var i = (this.length >>> 0) - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return i;
    }
    return -1;
  });
})();
`;

function buildWindowsViewer() {
  const viewerDir = path.resolve(__dirname, '..', 'packages', 'viewer', 'src');
  const sourcePath = path.join(viewerDir, 'viewer.html');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const moduleScript = source.match(/<script type="module">([\s\S]*?)<\/script>/);

  if (!moduleScript) {
    throw new Error('viewer.html does not contain the expected module script.');
  }

  const pdfSourcePath = path.join(viewerDir, 'build', 'pdf.mjs');
  const patchedPdfPath = path.join(viewerDir, 'build', 'pdf.windows-source.mjs');
  const workerSourcePath = path.join(viewerDir, 'build', 'pdf.worker.mjs');
  const patchedWorkerPath = path.join(viewerDir, 'build', 'pdf.worker.windows-source.mjs');
  const patchedPdfSource = fs
    .readFileSync(pdfSourcePath, 'utf8')
    .replace(
      /import\(\/\*webpackIgnore: true\*\/"(?:fs|http|https|url)"\)/g,
      'Promise.reject(new Error("Node-only module unavailable"))',
    )
    .replace(
      'import(/*webpackIgnore: true*/this.workerSrc)',
      'Promise.resolve(globalThis.pdfjsWorker)',
    );
  fs.writeFileSync(patchedPdfPath, patchedPdfSource);

  const patchedWorkerSource = fs
    .readFileSync(workerSourcePath, 'utf8')
    .replace(
      'new RegExp("^(\\\\s)|(\\\\p{Mn})|(\\\\p{Cf})$", "u")',
      'new RegExp("^(\\\\s)|([\\\\u0300-\\\\u036f])|([\\\\u00ad\\\\u200b-\\\\u200f\\\\u202a-\\\\u202e\\\\u2060-\\\\u206f\\\\ufeff])$")',
    );
  fs.writeFileSync(patchedWorkerPath, patchedWorkerSource);

  const appEntry = moduleScript[1]
    .replace("'./build/pdf.mjs'", "'./build/pdf.windows-source.mjs'")
    .replace("'./build/pdf.worker.mjs'", "'./build/pdf.worker.windows.js'");
  const entry = `import './build/pdf.worker.windows-source.mjs';\n${appEntry}`;

  esbuild.buildSync({
    stdin: {
      contents: entry,
      loader: 'js',
      resolveDir: viewerDir,
      sourcefile: 'viewer-entry.js',
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    // RNW 0.76's UWP WebView surface can still run on the legacy EdgeHTML
    // JavaScript engine, which requires optional catch bindings and newer
    // class syntax to be lowered.
    target: ['es2017'],
    banner: {js: LEGACY_ENGINE_POLYFILLS},
    outfile: path.join(viewerDir, 'viewer.windows.js'),
    logLevel: 'warning',
  });

  esbuild.buildSync({
    entryPoints: [patchedWorkerPath],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2017'],
    banner: {js: LEGACY_ENGINE_POLYFILLS},
    outfile: path.join(viewerDir, 'build', 'pdf.worker.windows.js'),
    logLevel: 'warning',
  });

  const windowsHtml = source.replace(
    moduleScript[0],
    '<script src="./viewer.windows.js"></script>',
  );
  fs.writeFileSync(path.join(viewerDir, 'viewer.windows.html'), windowsHtml);
  fs.unlinkSync(patchedPdfPath);
  fs.unlinkSync(patchedWorkerPath);
}

if (require.main === module) {
  buildWindowsViewer();
  console.log('Built the Windows-compatible PDF viewer assets.');
}

module.exports = {buildWindowsViewer};
