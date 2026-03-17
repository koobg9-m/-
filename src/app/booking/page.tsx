import { Suspense } from "react";
import dynamic from "next/dynamic";
import RequireAuth from "@/components/auth/RequireAuth";
import BookingForm from "@/components/booking/BookingForm";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function BookingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 md:py-12">
          <div className="content-container">
            <RequireAuth>
              <Suspense fallback={<div className="text-center py-16 text-gray-500">로딩 중...</div>}>
                <BookingForm />
              </Suspense>
            </RequireAuth>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
