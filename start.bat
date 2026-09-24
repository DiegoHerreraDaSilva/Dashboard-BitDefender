@echo off
setlocal

cd /d "%~dp0"

if not exist ".next\standalone\server.js" (
  echo Build standalone nao encontrado. Rode "npm run build" primeiro.
  pause
  exit /b 1
)

echo Copiando arquivos estaticos e configuracao para o build standalone...
xcopy /e /i /y "public" ".next\standalone\public" >nul
xcopy /e /i /y ".next\static" ".next\standalone\.next\static" >nul
if exist ".env.local" copy /y ".env.local" ".next\standalone\.env.local" >nul

echo.
echo Iniciando o painel GravityZone...
echo (feche esta janela ou pressione Ctrl+C para parar o servidor)
echo.

set PORT=3003
set HOSTNAME=0.0.0.0

cd ".next\standalone"
node server.js

pause
