@echo off
rem RELEASE + NEW ANDROID APK for BCS Monster (only needed when native parts change). Normal updates: release.bat
cd /d "%~dp0"
set "FLAGS=-Apk"
if not exist deploy\logs mkdir deploy\logs
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\deploy\release.ps1' %FLAGS% *>&1 | Tee-Object -FilePath ('deploy\logs\release-' + (Get-Date -Format yyyyMMdd-HHmmss) + '.log')"
echo.
timeout /t 25
