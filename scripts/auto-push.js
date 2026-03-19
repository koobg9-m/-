/**
 * GitHub push
 * npm run push        - 즉시 1회 push
 * npm run watch:push  - 파일 변경 감시 후 자동 push
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DEBOUNCE_MS = 15000; // 15초 대기 후 push
const WATCH_DIRS = ["src", "public", "scripts", ".github", "app"];
const WATCH_FILES = [
  "package.json",
  "next.config.js",
  "tailwind.config.js",
  "postcss.config.js",
  "vercel.json",
  ".env.example",
  "SETUP.md",
  "DEPLOY.md",
  "SYNC.md",
];

let timeoutId = null;

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: "inherit", ...opts });
    return true;
  } catch {
    return false;
  }
}

function push() {
  console.log("\n[auto-push] 변경사항 push 중...");
  const msg = `update: ${new Date().toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}`;
  if (!run("git add -A")) return;
  const hasChanges = run("git diff --cached --quiet", { stdio: "pipe" }) === false;
  if (!hasChanges) {
    console.log("[auto-push] 커밋할 변경사항 없음");
    return;
  }
  if (!run(`git commit -m "${msg}"`)) return;
  if (run("git push origin main") || run("git push origin master")) {
    console.log("[auto-push] ✓ GitHub push 완료");
  } else {
    console.log("[auto-push] push 실패 (원격 저장소 확인)");
  }
}

function schedule() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(push, DEBOUNCE_MS);
  console.log(`[auto-push] ${DEBOUNCE_MS / 1000}초 후 push 예정...`);
}

function watchDir(dir) {
  const full = path.join(process.cwd(), dir);
  if (!fs.existsSync(full)) return;
  try {
    fs.watch(full, { recursive: true }, () => schedule());
  } catch {
    // recursive watch 미지원 시 하위 디렉터리 개별 감시
  }
}

function main() {
  const isWatch = process.argv.includes("--watch") || process.env.WATCH_PUSH === "1";

  if (isWatch) {
    console.log("========================================");
    console.log("  GitHub 자동 push 감시 시작");
    console.log("  (파일 변경 후 15초 대기 → push)");
    console.log("  종료: Ctrl+C");
    console.log("========================================\n");

    WATCH_DIRS.forEach(watchDir);
    for (const f of WATCH_FILES) {
      const full = path.join(process.cwd(), f);
      if (fs.existsSync(full)) {
        try {
          fs.watch(full, () => schedule());
        } catch {}
      }
    }
  } else {
    push();
  }
}

main();
