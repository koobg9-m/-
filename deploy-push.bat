@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub 업로드 및 Vercel 배포 트리거
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Git 상태 확인...
"C:\Program Files\Git\bin\git.exe" status

echo.
echo [2] 모든 변경사항 추가...
"C:\Program Files\Git\bin\git.exe" add .

echo.
echo [3] 커밋 (변경 없으면 스킵)...
"C:\Program Files\Git\bin\git.exe" diff --cached --quiet 2>nul && (
  echo 변경사항 없음 - 이미 최신 상태
) || (
  "C:\Program Files\Git\bin\git.exe" commit -m "update: apply latest changes"
)

echo.
echo [4] GitHub에 push...
"C:\Program Files\Git\bin\git.exe" push origin main

if errorlevel 1 (
  echo.
  echo [실패] push 실패 - GitHub 로그인 확인 (Personal Access Token)
) else (
  echo.
  echo [완료] GitHub 업로드 성공!
  echo Vercel이 자동으로 새 배포를 시작합니다. 2~3분 후 https://mimisalon.vercel.app 새로고침 (Ctrl+Shift+R)
)

echo.
pause
