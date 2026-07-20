const path = require('path');

/**
 * In the workspace, npm hoists a vanilla `react-native` to the repo root (it
 * arrives as a transitive dependency) while this app's actual runtime,
 * react-native-macos, stays in its own node_modules. The CLI autodetects the
 * former and then reports no platforms and no commands — which is why
 * `start` / `run-macos` go missing.
 *
 * Pointing reactNativePath at the macOS fork restores both.
 */
module.exports = {
  // Resolved rather than joined: npm may hoist react-native-macos to the repo
  // root or keep it in this app's tree, and a hardcoded path silently points
  // at nothing when it lands in the other one.
  reactNativePath: path.dirname(
    require.resolve('react-native-macos/package.json', {paths: [__dirname]}),
  ),
};
