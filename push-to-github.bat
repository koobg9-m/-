@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub에 코드 올리기
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Git 초기화...
git init
if errorlevel 1 (
    echo.
    echo [오류] Git이 설치되지 않았습니다.
    echo https://git-scm.com/download/win 에서 Git을 설치한 후
    echo Cursor를 다시 시작하고 이 파일을 다시 실행하세요.
    pause
    exit /b 1
)

echo [2/6] 파일 추가...
git add .

echo [3/6] 커밋...
git commit -m "first commit"

echo [4/6] 브랜치 설정...
git branch -M main

echo [5/6] GitHub 연결...
git remote remove origin 2>nul
git remote add origin https://github.com/koobg9-m/-.git

echo [6/6] GitHub에 올리기 (로그인 필요)...
echo.
echo ※ Username: koobg9-m
echo ※ Password: GitHub 비밀번호가 아닌 Personal Access Token 입력!
echo   (토큰 없으면: GitHub - Settings - Developer settings - Personal access tokens)
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo [실패] push에 실패했습니다.
    echo - Personal Access Token을 사용했는지 확인하세요.
    echo - GitHub 저장소가 존재하는지 확인하세요.
) else (
    echo.
    echo [완료] 성공적으로 GitHub에 올라갔습니다!
    echo https://github.com/koobg9-m/- 에서 확인하세요.
)

echo.
pause
