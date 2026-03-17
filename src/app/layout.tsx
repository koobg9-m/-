import type { Metadata } from "next";
import "./globals.css";
import RootErrorBoundary from "@/components/RootErrorBoundary";

export const metadata: Metadata = {
  title: "미미살롱펫 - 찾아가는 펫 미용 서비스",
  description: "전문 그루머가 가정을 방문합니다. 강아지 미용 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <RootErrorBoundary>{children}</RootErrorBoundary>
      </body>
    </html>
  );
}
