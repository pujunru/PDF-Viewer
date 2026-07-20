const path = require('path');

module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The shell lives in the workspace packages outside this directory, so Jest
  // needs the same monorepo resolution Metro has (see metro.config.js).
  roots: ['<rootDir>', path.resolve(__dirname, '../packages')],
  // A shared package resolving react-native-webview walks up from packages/,
  // which never reaches this app's node_modules — where npm installs it.
  modulePaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../node_modules'),
  ],
  moduleNameMapper: {
    '^@pdf-viewer/([^/]+)/src/(.*)$': path.resolve(__dirname, '../packages/$1/src/$2'),
    '^@pdf-viewer/([^/]+)$': path.resolve(__dirname, '../packages/$1/src/index.ts'),
  },
  // react-native-webview ships untranspiled ESM, like react-native itself.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|react-native-webview)/)',
  ],
};
