/**
 * WebView is backed by a native module that does not exist under Jest, so
 * importing it for real throws before any test runs. The shell only ever calls
 * postMessage on the instance, so a stand-in view is enough to render the tree.
 */
jest.mock('react-native-webview', () => {
  const React = require('react');
  const {View} = require('react-native');
  const WebView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({postMessage: jest.fn()}));
    return React.createElement(View, props);
  });
  return {__esModule: true, default: WebView, WebView};
});

/**
 * The macOS shell reads the bundled viewer URL and picks files through these
 * two native modules. They are added to the live registry rather than mocking
 * the module wholesale: replacing it detaches RN's own TurboModule lookups
 * (Platform, StyleSheet) and the import graph fails before any test runs.
 */
const {NativeModules} = require('react-native');
NativeModules.BundleResources = {viewerURL: 'file:///test/viewer.html'};
NativeModules.FilePicker = {
  openPDF: jest.fn(),
  saveBytes: jest.fn(),
  saveAsPDF: jest.fn(),
};
