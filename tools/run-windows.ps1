param(
    [switch]$NoBuild,
    [switch]$NoPackager
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

Get-Process -Name PDFViewer -ErrorAction SilentlyContinue | Stop-Process -Force

if (-not $NoBuild) {
    & node (Join-Path $PSScriptRoot 'build-windows.js')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$manifestPath = Join-Path $repoRoot 'app/windows/x64/Debug/PDFViewer/AppxManifest.xml'
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Windows build output was not found: $manifestPath"
}

$installLocation = Split-Path -Parent $manifestPath
$existingPackage = Get-AppxPackage -Name 'cf956e12-5b36-45a1-b177-95c9fed83cc5'
if ($existingPackage -and
    -not [string]::Equals(
        $existingPackage.InstallLocation,
        $installLocation,
        [StringComparison]::OrdinalIgnoreCase)) {
    Remove-AppxPackage -Package $existingPackage.PackageFullName
}

Add-AppxPackage -Register $manifestPath -ForceApplicationShutdown
$package = Get-AppxPackage -Name 'cf956e12-5b36-45a1-b177-95c9fed83cc5'
if (-not $package) { throw 'PDF Viewer package registration failed.' }

$pfn = $package.PackageFamilyName
$loopback = Join-Path $env:SystemRoot 'System32/CheckNetIsolation.exe'
& $loopback LoopbackExempt -a "-n=$pfn" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Windows needs administrator approval for the one-time Metro loopback exemption.'
    $process = Start-Process -FilePath $loopback -Verb RunAs -Wait -PassThru `
        -ArgumentList @('LoopbackExempt', '-a', "-n=$pfn")
    if ($process.ExitCode -ne 0) { throw 'Could not add the Metro loopback exemption.' }
}

if (-not $NoPackager) {
    $metro = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
    if (-not $metro) {
        Start-Process -FilePath 'npm.cmd' -WorkingDirectory $repoRoot `
            -ArgumentList @('run', 'start', '--workspace', '@pdf-viewer/native')
        Write-Host 'Started Metro on port 8081.'
    }
}

Start-Process -FilePath 'explorer.exe' -ArgumentList "shell:AppsFolder\$pfn!App"
Write-Host 'Started PDF Viewer.'
