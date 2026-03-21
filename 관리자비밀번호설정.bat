@echo off
echo 미미살롱 관리자 비밀번호 설정 도구
echo.
set /p password="설정할 관리자 비밀번호를 입력하세요: "
echo.
echo 비밀번호를 설정하고 배포합니다...
node setup-admin-password.js %password%
echo.
pause