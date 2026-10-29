@echo off
cd /d "%~dp0..\.."
echo Capturing the Framer template at desktop size. This can take a few minutes. Please wait...
call npm run design:extract:desktop
echo.
echo Finished. Tell Codex: "The desktop design capture is done." You can close this window.
pause
