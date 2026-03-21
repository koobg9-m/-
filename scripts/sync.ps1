# PowerShell 스크립트: sync.ps1
# auto-push.js 실행
Write-Host "자동 푸시 시작..."
node scripts/auto-push.js

# 배포 실행
Write-Host "배포 시작..."
npm run deploy