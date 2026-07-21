#!/usr/bin/env node

const {existsSync} = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const {buildWindowsViewer} = require('./build-viewer-windows');

if (process.platform !== 'win32') {
  console.error('The Windows native app can only be built on Windows.');
  process.exit(1);
}

buildWindowsViewer();

const repoRoot = path.resolve(__dirname, '..');
const vswhere = path.join(
  process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
  'Microsoft Visual Studio',
  'Installer',
  'vswhere.exe',
);

if (!existsSync(vswhere)) {
  console.error('vswhere.exe was not found. Install Visual Studio 2022 Build Tools.');
  process.exit(1);
}

// RNW 0.76 targets the VS 2022 (v143) toolset. `-products *` is important:
// without it vswhere silently excludes the Build Tools SKU.
const discovery = spawnSync(
  vswhere,
  [
    '-latest',
    '-products',
    '*',
    '-version',
    '[17.0,18.0)',
    '-requires',
    'Microsoft.Component.MSBuild',
    '-property',
    'installationPath',
  ],
  {encoding: 'utf8'},
);
const installationPath = discovery.stdout.trim();
const msbuild = path.join(
  installationPath,
  'MSBuild',
  'Current',
  'Bin',
  'amd64',
  'MSBuild.exe',
);

if (!installationPath || !existsSync(msbuild)) {
  console.error('Visual Studio 2022 MSBuild was not found.');
  process.exit(1);
}

const configuration = process.argv.includes('--release') ? 'Release' : 'Debug';
const outputRoot = path
  .join(repoRoot, 'app', 'windows', 'x64', configuration)
  .replaceAll('\\', '/');

// Some hosted shells expose both PATH and Path. Old .NET Framework MSBuild
// tasks treat those as duplicate dictionary keys, so normalize before launch.
const env = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.toLowerCase() === 'path') {
    if (!env.Path) env.Path = value;
  } else {
    env[key] = value;
  }
}

const result = spawnSync(
  msbuild,
  [
    path.join(repoRoot, 'app', 'windows', 'PDFViewer.sln'),
    '/restore',
    `/p:Configuration=${configuration}`,
    '/p:Platform=x64',
    '/p:PlatformToolset=v143',
    // Folly's Release optimization exhausts the 32-bit hosted compiler's heap
    // (fatal error C1076), so force the x64-hosted toolchain, which has the
    // address space to compile it. Harmless for Debug.
    '/p:PreferredToolArchitecture=x64',
    '/p:WindowsTargetPlatformVersion=10.0.22621.0',
    '/p:TargetPlatformVersion=10.0.22621.0',
    `/p:BaseOutputPath=${outputRoot}/`,
    '/p:AppxBundle=Never',
    '/m',
    '/nr:false',
    '/nologo',
    '/verbosity:minimal',
  ],
  {cwd: repoRoot, env, stdio: 'inherit'},
);

process.exit(result.status ?? 1);
