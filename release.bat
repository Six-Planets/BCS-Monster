@echo off
rem ONE-CLICK RELEASE: builds and publishes BCS Monster. Add  apk  to also ship a new Android APK:  release.bat apk
cd /d "%~dp0"
if /i "%1"=="apk" (set "FLAGS=-Apk") else (set "FLAGS=")
if not exist deploy\logs mkdir deploy\logs
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\deploy\release.ps1' %FLAGS% *>&1 | Tee-Object -FilePath ('deploy\logs\release-' + (Get-Date -Format yyyyMMdd-HHmmss) + '.log')"
echo.
timeout /t 25
