/**
 * 로그인 수단 안내 — 카카오 / 이메일
 */
export default function LoginMethodGuide() {
  const items = [
    { icon: "💬", name: "카카오톡", desc: "카카오 계정으로 바로 시작" },
    { icon: "✉️", name: "이메일", desc: "받은 링크를 눌러 로그인" },
  ] as const;

  return (
    <div className="rounded-2xl bg-stone-50/90 border border-stone-200/80 px-4 py-3 mb-5">
      <p className="text-[11px] font-semibold text-stone-500 tracking-wide mb-2.5">로그인 방법</p>
      <ul className="space-y-2">
        {items.map((row) => (
          <li key={row.name} className="flex items-start gap-2.5 text-[13px] leading-snug text-stone-700">
            <span className="text-lg leading-none shrink-0 select-none" aria-hidden>
              {row.icon}
            </span>
            <span>
              <span className="font-semibold text-stone-800">{row.name}</span>
              <span className="text-stone-500"> · {row.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
