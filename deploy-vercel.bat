@echo off
chcp 65001 >nul
echo ========================================
echo   Vercel 배포
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Vercel 로그인 (처음 한 번만)
echo     - 브라우저가 열리면 GitHub로 로그인하세요
echo.
call npx --yes vercel login

echo.
echo [2] 배포 실행...
call npx --yes vercel --prod

echo.
pause
