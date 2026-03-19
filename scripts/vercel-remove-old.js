#!/usr/bin/env node
/**
 * Vercel 오래된/빈 배포 삭제
 * 1순위: CANCELED, ERROR (빈 것)
 * 2순위: 가장 오래된(맨 처음) 배포
 * 로컬 파일은 건드리지 않음 (Vercel 서버 배포만 삭제)
 */
const { execSync } = require("child_process");

const SCOPE = "koobg9-ms-projects";
const PROJECT = "mimisalon";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

function main() {
  const count = parseInt(process.argv[2] || "1", 10);
  console.log(`[vercel-remove-old] ${count}개 배포 삭제 (CANCELED/ERROR 우선, 그다음 가장 오래된 것)`);

  const raw = run(`npx vercel list ${PROJECT} --format json --scope ${SCOPE} --yes`);
  const data = JSON.parse(raw);
  const deployments = data.deployments || [];

  const canceled = deployments.filter((d) => d.state === "CANCELED" || d.state === "ERROR");
  const ready = deployments.filter((d) => d.state === "READY");
  let targets = canceled.slice(0, count);
  if (targets.length < count) {
    const need = count - targets.length;
    targets = [...targets, ...ready.slice(-need)];
  }

  if (targets.length === 0) {
    console.log("삭제할 배포가 없습니다.");
    return;
  }

  for (const d of targets) {
    const url = d.url || d.name;
    console.log(`삭제: ${url} (state: ${d.state}, createdAt: ${new Date(d.createdAt).toISOString()})`);
    try {
      run(`npx vercel remove ${url} --safe --yes --scope ${SCOPE}`);
      console.log(`  ✓ 삭제 완료`);
    } catch (e) {
      console.error(`  ✗ 실패:`, e.message);
    }
  }
}

main();
