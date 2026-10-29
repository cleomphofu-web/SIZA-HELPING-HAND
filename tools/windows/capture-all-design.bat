@echo off
cd /d "%~dp0..\.."
echo Capturing the Framer template at phone, tablet and desktop size. This can take several minutes. Please wait...
call npm run design:extract
echo.
echo Finished. Tell Codex: "The design capture is done." You can close this window.
pause
