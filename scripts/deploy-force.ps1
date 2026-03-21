# PowerShell 스크립트: deploy-force.ps1
# .next 폴더 삭제
Write-Host "캐시 정리 중..."
if (Test-Path -Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# 빌드 실행
Write-Host "빌드 시작..."
npm run build

# 배포 실행
Write-Host "배포 시작..."
npx vercel --prod --yes --force --scope koobg9-ms-projects