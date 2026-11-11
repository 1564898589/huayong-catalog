@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Huayong Catalog Update
node update.js
echo.
pause