const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

// Located rather than hardcoded: npm may hoist this to the repo root or keep it
// in the app's own tree depending on how the workspace resolves.
const reactNativeMacOS = path.dirname(
  require.resolve('react-native-macos/package.json', {paths: [projectRoot]}),
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The shell lives in the workspace packages (@pdf-viewer/*), which sit outside
 * this app directory, so Metro has to watch the repo root and resolve modules
 * from both node_modules trees (npm hoists most deps to the root, but keeps
 * react-native-macos here).
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [repoRoot],
  resolver: {
    nodeModulesPaths: [
      path.join(projectRoot, 'node_modules'),
      path.join(repoRoot, 'node_modules'),
    ],
    /**
     * The shared packages import 'react-native'; on this platform that has to
     * be react-native-macos, which npm installs into this app's own tree.
     *
     * A plain object here would shadow resolution for *every* bare import,
     * so anything not listed (@babel/runtime, react, the pdf.js deps) would
     * fail to resolve. The proxy overrides only the one name and lets Metro
     * fall back to nodeModulesPaths for the rest.
     */
    extraNodeModules: new Proxy(
      {'react-native': reactNativeMacOS},
      {
        get: (target, name) => {
          if (name in target) {
            return target[name];
          }
          // npm hoists most packages to the repo root but keeps some here, so
          // the fallback has to check this app's tree before the root's.
          const local = path.join(projectRoot, 'node_modules', String(name));
          return fs.existsSync(local)
            ? local
            : path.join(repoRoot, 'node_modules', String(name));
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
