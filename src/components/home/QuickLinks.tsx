import Link from "next/link";

export default function QuickLinks() {
  return (
    <Link
      href="/tips"
      prefetch={false}
      className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-white hover:border-mimi-primary/30 hover:bg-mimi-primary/5 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍽️</span>
        <div>
          <h3 className="font-bold text-mimi-charcoal group-hover:text-mimi-primary transition-colors">육아 노하우</h3>
          <p className="text-sm text-mimi-slate mt-0.5">반려동물 케어 팁</p>
        </div>
      </div>
      <span className="text-mimi-primary">→</span>
    </Link>
  );
}
