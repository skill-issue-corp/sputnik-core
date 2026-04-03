#!/bin/bash
cd "$(dirname "$0")" || exit
echo "Checking dependencies..."
npm install
npx tsx src/main.ts gen-locale