import { AdminGuard } from "./AdminGuard";
import { AdminDashboard } from "./AdminDashboard";

export function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
