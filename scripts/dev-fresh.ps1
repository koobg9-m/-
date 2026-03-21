# PowerShell 스크립트: dev-fresh.ps1
# .next 폴더 삭제
Write-Host "캐시 정리 중..."
if (Test-Path -Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# 포트 5006을 사용하는 프로세스 종료 시도
try {
    $process = Get-NetTCPConnection -LocalPort 5006 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Write-Host "포트 5006을 사용하는 프로세스 종료: $process"
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "포트 5006 확인 중 오류: $_"
}

# npm run dev 실행
Write-Host "개발 서버 시작..."
npm run dev