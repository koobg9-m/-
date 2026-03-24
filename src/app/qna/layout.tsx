import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문 (Q&A) | 미미살롱펫",
  description:
    "예약, 결제, 취소·환불, 방문 미용, 디자이너 방문 등 미미살롱펫 고객 문의 FAQ입니다.",
  openGraph: {
    title: "자주 묻는 질문 | 미미살롱펫",
    description: "예약·결제·취소·방문 미용 등 고객 문의 FAQ",
  },
};

export default function QnaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
