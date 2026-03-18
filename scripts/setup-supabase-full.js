#!/usr/bin/env node
/**
 * Supabase 전체 자동 설정
 * 1. SUPABASE_ACCESS_TOKEN 환경변수 필요 (https://supabase.com/dashboard/account/tokens)
 * 2. 프로젝트 생성 → 마이그레이션 실행 → .env.local 업데이트
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const API = "https://api.supabase.com/v1";
const token = process.env.SUPABASE_ACCESS_TOKEN;

async function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      url,
      {
        method: opts.method || "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...opts.headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

async function main() {
  console.log("🚀 Supabase 전체 설정 시작\n");

  if (!token) {
    console.log("❌ SUPABASE_ACCESS_TOKEN이 필요합니다.");
    console.log("   1. https://supabase.com/dashboard/account/tokens 접속");
    console.log("   2. Generate new token 클릭");
    console.log("   3. 터미널에서 실행: set SUPABASE_ACCESS_TOKEN=발급받은토큰");
    console.log("   4. npm run setup:supabase:full 다시 실행\n");
    process.exit(1);
  }

  // 1. 조직 목록 (없으면 생성)
  const orgRes = await fetch(`${API}/organizations`);
  if (orgRes.status === 401 || orgRes.status === 403) {
    console.log("❌ 토큰이 유효하지 않습니다. 새 토큰을 발급해 주세요.");
    process.exit(1);
  }
  let orgs = Array.isArray(orgRes.data) ? orgRes.data : orgRes.data?.organizations || orgRes.data?.data || [];
  if (!orgs.length) {
    console.log("조직이 없어 새 조직을 생성합니다...");
    const createOrg = await fetch(`${API}/organizations`, {
      method: "POST",
      body: { name: "mimisalon" },
    });
    if (createOrg.status !== 201 || !createOrg.data?.id) {
      console.log("❌ 조직 생성 실패:", createOrg.data?.message || createOrg.status);
      process.exit(1);
    }
    orgs = [createOrg.data];
    console.log("✅ 조직 생성됨:", createOrg.data.name);
  }
  const org = orgs[0];
  console.log(`✅ 조직: ${org.name || org.slug || org.id}`);

  // 2. 프로젝트 생성
  const dbPass = "mimisalon_" + Date.now().toString(36);
  const projectName = "mimisalon-pet";
  const orgSlug = org.slug || org.name || String(org.id).slice(0, 8);
  const { status, data: project } = await fetch(`${API}/projects`, {
    method: "POST",
    body: {
      name: projectName,
      db_pass: dbPass,
      organization_slug: orgSlug,
      region: "ap-northeast-2",
    },
  });

  if (status !== 201 || !project?.ref) {
    console.log("❌ 프로젝트 생성 실패:", project?.message || project?.error || status);
    if (project?.message) console.log("   ", project.message);
    process.exit(1);
  }

  console.log(`✅ 프로젝트 생성됨: ${project.name} (${project.ref})`);
  console.log("   프로젝트 준비 대기 중... (1~2분 소요)");

  // 3. 프로젝트 활성화 대기
  let ready = false;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const { data: p } = await fetch(`${API}/projects/${project.ref}`);
    if (p?.status === "ACTIVE_HEALTHY" || p?.status === "ACTIVE") {
      ready = true;
      break;
    }
    process.stdout.write(".");
  }
  if (!ready) {
    console.log("\n❌ 프로젝트 준비 시간 초과. Supabase 대시보드에서 확인해 주세요.");
    process.exit(1);
  }
  console.log("\n✅ 프로젝트 준비 완료");

  // 4. API 키 조회
  const { data: keys } = await fetch(`${API}/projects/${project.ref}/api-keys`);
  const anonKey = keys?.find((k) => k.name === "anon")?.api_key;
  const url = `https://${project.ref}.supabase.co`;

  if (!anonKey) {
    console.log("⚠ anon key를 찾을 수 없습니다. 대시보드에서 확인해 주세요.");
  }

  // 5. .env.local 업데이트
  const envPath = path.join(__dirname, "..", ".env.local");
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  env = env.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/g, `NEXT_PUBLIC_SUPABASE_URL=${url}`);
  env = env.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey || ""}`);
  if (!env.includes("NEXT_PUBLIC_SUPABASE_URL=")) {
    env += `\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey || ""}\n`;
  }
  fs.writeFileSync(envPath, env.trim() + "\n");
  console.log("✅ .env.local 업데이트 완료");

  // 6. supabase link & db push
  const { execSync } = require("child_process");
  try {
    execSync(`npx supabase link --project-ref ${project.ref} -p "${dbPass}" --yes`, {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
    execSync("npx supabase db push", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
    console.log("✅ 마이그레이션 적용 완료");
  } catch (e) {
    console.log("\n⚠ supabase db push 실패. 아래 SQL을 Supabase 대시보드 SQL Editor에서 실행해 주세요:");
    console.log("   https://supabase.com/dashboard/project/" + project.ref + "/sql\n");
    const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "20250314000000_app_data.sql");
    if (fs.existsSync(sqlPath)) {
      console.log(fs.readFileSync(sqlPath, "utf8"));
    }
  }

  console.log("\n🎉 설정 완료!");
  console.log("   URL:", url);
  console.log("   npm run dev 로 앱을 실행하세요.");
}

main().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
