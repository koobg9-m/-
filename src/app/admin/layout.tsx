import AdminProductionGuard from "@/components/admin/AdminProductionGuard";
import AdminAuthCheck from "@/components/admin/AdminAuthCheck";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // AdminAuthCheck 컴포넌트를 추가하여 인증 상태 확인
  return (
    <AdminProductionGuard>
      <AdminAuthCheck>{children}</AdminAuthCheck>
    </AdminProductionGuard>
  );
}