#!/usr/bin/env node

// react-native-webview does not ship a Windows build that can host our packaged
// pdf.js viewer, so we apply a source patch after every install. Keeping it here
// (run from the root package.json postinstall) means `npm install` re-applies it
// and CI stays reproducible. The patch is idempotent and refuses to run against
// an unexpected upstream file.

const fs = require('fs');
const path = require('path');

const windowsDir = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'react-native-webview',
  'windows',
  'ReactNativeWebView',
);

function patchFile(relPath, apply) {
  const target = path.join(windowsDir, relPath);
  if (!fs.existsSync(target)) {
    console.error(`react-native-webview Windows source not found: ${relPath}. Run npm install first.`);
    process.exit(1);
  }
  const source = fs.readFileSync(target, 'utf8');
  const next = apply(source);
  if (next === null) {
    console.log(`react-native-webview patch already applied: ${relPath}.`);
    return;
  }
  if (next === false) {
    console.error(`react-native-webview changed; refusing to apply an unverified patch to ${relPath}.`);
    process.exit(1);
  }
  fs.writeFileSync(target, next);
  console.log(`Applied react-native-webview patch: ${relPath}.`);
}

// Asset host: WebView2 (Chromium) cannot navigate ms-appx-web:// like the
//    legacy EdgeHTML WebView, so expose the packaged install folder through a
//    virtual host (https://assets.pdfviewer/...). The mapping is installed in
//    OnCoreWebView2Initialized, which fires before the first navigation because
//    NavigateWithWebResourceRequest awaits EnsureCoreWebView2Async().
patchFile('ReactWebView2.cpp', (source) => {
  const includeAnchor = '#include <winrt/Windows.System.h>\n';
  const includeLine = '#include <winrt/Windows.ApplicationModel.h>\n';
  const eventAnchor = `        assert(sender.CoreWebView2());

        RegisterCoreWebView2Events();

        if (m_navigateToHtml != L"") {`;
  const mappingBlock = `        assert(sender.CoreWebView2());

        RegisterCoreWebView2Events();

        // PDFViewer patch: WebView2 (Chromium) cannot navigate ms-appx-web://
        // URIs the way the legacy EdgeHTML WebView could, so packaged app assets
        // are exposed to it through a virtual host mapped to the install folder.
        // The app then navigates to https://assets.pdfviewer/... and pdf.js pulls
        // its siblings (build/*.js, web/*, sample.pdf) by relative path. This runs
        // before the initial navigation because NavigateWithWebResourceRequest
        // awaits EnsureCoreWebView2Async(), which is what fires this event.
        try {
            auto installPath =
                winrt::Windows::ApplicationModel::Package::Current().InstalledLocation().Path();
            sender.CoreWebView2().SetVirtualHostNameToFolderMapping(
                L"assets.pdfviewer",
                installPath,
                winrt::CoreWebView2HostResourceAccessKind::Allow);
        } catch (...) {
            // A non-packaged host has no InstalledLocation; the mapping is simply
            // skipped and normal (http/https/file) navigation still works.
        }

        if (m_navigateToHtml != L"") {`;

  if (source.includes('SetVirtualHostNameToFolderMapping')) return null;
  if (!source.includes(includeAnchor) || !source.includes(eventAnchor)) return false;
  let next = source;
  if (!next.includes(includeLine)) {
    next = next.replace(includeAnchor, includeAnchor + includeLine);
  }
  next = next.replace(eventAnchor, mappingBlock);
  return next;
});
