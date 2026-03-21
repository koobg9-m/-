# PowerShell 스크립트: deploy.ps1
# 빌드 실행
Write-Host "빌드 시작..."
npm run build

# 배포 실행
Write-Host "배포 시작..."
npx vercel --prod --yes --force --scope koobg9-ms-projects