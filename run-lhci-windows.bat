@echo off
REM run-lhci-windows.bat — double-click or run from CMD
REM Fixes the EPERM crash by keeping Chrome temp files inside the project.

echo.
echo === NevUp Track 3 — Lighthouse CI (Windows fix) ===
echo.

REM Create local temp folder
if not exist tmp-lhci-chrome mkdir tmp-lhci-chrome

REM Redirect Windows temp to local folder
set TEMP=%CD%\tmp-lhci-chrome
set TMP=%CD%\tmp-lhci-chrome
set TMPDIR=%CD%\tmp-lhci-chrome

echo [1/2] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
  echo BUILD FAILED — fix errors above and retry.
  pause
  exit /b 1
)

echo.
echo [2/2] Running Lighthouse CI...
call npx lhci autorun

REM Clean up
rmdir /s /q tmp-lhci-chrome 2>nul

echo.
echo Done. Check lhci-results\ for the JSON report.
pause
