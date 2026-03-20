import AdminProductionGuard from "@/components/admin/AdminProductionGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProductionGuard>{children}</AdminProductionGuard>;
}
