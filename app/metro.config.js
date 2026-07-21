const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const fs = require('fs');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');
const rnwPath = fs.realpathSync(
  path.dirname(
    require.resolve('react-native-windows/package.json', {paths: [projectRoot]}),
  ),
);
const rnmacPath = fs.realpathSync(
  path.dirname(
    require.resolve('react-native-macos/package.json', {paths: [projectRoot]}),
  ),
);

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const config = {
  watchFolders: [repoRoot],
  resolver: {
    blockList: exclusionList([
      // This stops "npx @react-native-community/cli run-windows" from causing the metro server to crash if its already running
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`,
      ),
      // This prevents "npx @react-native-community/cli run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip or other files produced by msbuild
      new RegExp(`${rnwPath}/build/.*`),
      new RegExp(`${rnwPath}/target/.*`),
      /.*\.ProjectImports\.zip/,
    ]),
    nodeModulesPaths: [
      path.join(projectRoot, 'node_modules'),
      path.join(repoRoot, 'node_modules'),
    ],
    resolveRequest: (context, moduleName, platform) => {
      // Every shared package imports the canonical `react-native` name. Route
      // that name, including deep imports, to the runtime for this bundle.
      if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
        const runtime = platform === 'windows' ? rnwPath : rnmacPath;
        const suffix = moduleName.slice('react-native'.length);
        return context.resolveRequest(context, `${runtime}${suffix}`, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
