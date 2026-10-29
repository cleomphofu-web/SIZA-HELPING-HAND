@echo off
cd /d "%~dp0..\.."
echo Starting the SIZA site on your computer. Leave this window open. Close it to stop the site.
start "" cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:3000"
call npm run dev
pause
