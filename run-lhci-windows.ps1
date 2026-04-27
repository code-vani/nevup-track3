# run-lhci-windows.ps1
# Run from project root in PowerShell:
#   powershell -ExecutionPolicy Bypass -File ./run-lhci-windows.ps1
#
# Fixes two Windows-specific LHCI problems:
#   1. EPERM crash: Chrome locks temp files in AppData; we redirect to project folder
#   2. Server timeout: lighthouserc.js now waits 90 seconds for Next.js ready message

Write-Host "==> NevUp Track 3 - Lighthouse CI (Windows fix)" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$tmpDir = Join-Path $PWD ("tmp-lhci-chrome-$timestamp")
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
Write-Host "    Chrome temp dir: $tmpDir" -ForegroundColor Gray

$env:TEMP = $tmpDir
$env:TMP  = $tmpDir
$env:TMPDIR = $tmpDir

Write-Host ""
Write-Host "==> Step 1: Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Fix errors above and retry." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "==> Step 2: Running Lighthouse CI..." -ForegroundColor Yellow
npx lhci autorun
$lhciExit = $LASTEXITCODE

Start-Sleep -Seconds 2
Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

if ($lhciExit -eq 0) {
  Write-Host ""
  Write-Host "PASSED - Lighthouse CI results in ./lhci-results/" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Lighthouse CI finished with exit code $lhciExit" -ForegroundColor Red
  Write-Host "Check ./lhci-results/ for the full JSON report." -ForegroundColor Gray
  Write-Host "Exit code 1 from assertions = scores below threshold, check the report." -ForegroundColor Yellow
}
exit $lhciExit
