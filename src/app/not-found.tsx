import Link from "next/link";

/** App Router: 404 페이지 (누락 시 개발 오버레이에서 이상 동작할 수 있음) */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-mimi-cream">
      <div className="text-center max-w-md">
        <span className="text-6xl" aria-hidden>
          🔍
        </span>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">페이지를 찾을 수 없어요</h1>
        <p className="text-gray-600 mt-2">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3 bg-mimi-orange text-white rounded-full font-bold hover:bg-mimi-orange/90"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
