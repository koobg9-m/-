import Link from "next/link";

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        href="/qna"
        prefetch={false}
        className="flex items-center justify-between p-4 md:p-5 rounded-xl border-2 border-mimi-orange/25 bg-gradient-to-br from-white to-amber-50/50 hover:border-mimi-orange/50 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>
            💬
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-mimi-charcoal group-hover:text-mimi-primary transition-colors">문의·자주 묻는 질문</h3>
            <p className="text-sm text-mimi-slate mt-0.5">예약·취소·방문 미용 Q&amp;A</p>
          </div>
        </div>
        <span className="text-mimi-orange font-bold shrink-0">→</span>
      </Link>
      <Link
        href="/tips"
        prefetch={false}
        className="flex items-center justify-between p-4 md:p-5 rounded-xl border border-stone-200 bg-white hover:border-mimi-primary/30 hover:bg-mimi-primary/5 transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>
            🍽️
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-mimi-charcoal group-hover:text-mimi-primary transition-colors">육아 노하우</h3>
            <p className="text-sm text-mimi-slate mt-0.5">반려동물 케어 팁</p>
          </div>
        </div>
        <span className="text-mimi-primary shrink-0">→</span>
      </Link>
    </div>
  );
}
