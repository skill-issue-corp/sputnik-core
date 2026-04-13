@echo off
cd /d "%~dp0"
echo Checking dependencies...
call npm install
call npx tsx src/main.ts ai-translate
pause