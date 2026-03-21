/**
 * 미미살롱 관리자 비밀번호 자동 설정 스크립트
 * 
 * 사용법:
 * 1. 터미널에서 다음 명령어 실행: node setup-admin-password.js 원하는비밀번호
 * 2. Vercel CLI 로그인 요청이 나타나면 로그인
 * 3. 스크립트가 자동으로 환경 변수를 설정하고 재배포
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 비밀번호 인자 확인
const password = process.argv[2];
if (!password) {
  console.error('사용법: node setup-admin-password.js 원하는비밀번호');
  process.exit(1);
}

// Vercel CLI 설치 확인
try {
  console.log('Vercel CLI 확인 중...');
  execSync('vercel --version', { stdio: 'ignore' });
} catch (e) {
  console.log('Vercel CLI 설치 중...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Vercel 로그인 상태 확인
try {
  console.log('Vercel 로그인 상태 확인 중...');
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (e) {
  console.log('Vercel 로그인이 필요합니다. 브라우저가 열리면 로그인해주세요...');
  execSync('vercel login', { stdio: 'inherit' });
}

// 환경 변수 설정
console.log('관리자 비밀번호 환경 변수 설정 중...');
try {
  execSync(`vercel env add ADMIN_PASSWORD production`, { stdio: 'inherit' });
  console.log('비밀번호 입력 창이 열리면 다음 비밀번호를 입력하세요:', password);
} catch (e) {
  console.error('환경 변수 설정 중 오류 발생:', e.message);
  process.exit(1);
}

// 재배포
console.log('변경사항 배포 중...');
try {
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('✅ 성공! 관리자 비밀번호가 설정되었습니다.');
  console.log('이제 https://mimisalon.vercel.app/admin/login 에서 설정한 비밀번호로 로그인할 수 있습니다.');
} catch (e) {
  console.error('배포 중 오류 발생:', e.message);
  process.exit(1);
}