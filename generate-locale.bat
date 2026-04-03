@echo off
cd /d "%~dp0"
echo Checking dependencies...
npm install
npx tsx src/main.ts gen-locale