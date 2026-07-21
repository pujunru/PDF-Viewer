const path = require('path');

/**
 * This app has two native React Native runtimes. Select the fork that owns the
 * command being run so the community CLI loads the corresponding platform
 * commands instead of the vanilla `react-native` package npm hoists.
 */
const command = process.argv.join(' ');
const isWindows = /(?:init|run|autolink)-windows|--platform[ =]windows/.test(
  command,
);
const runtime = isWindows ? 'react-native-windows' : 'react-native-macos';

module.exports = {
  reactNativePath: path.dirname(
    require.resolve(`${runtime}/package.json`, {paths: [__dirname]}),
  ),
};
