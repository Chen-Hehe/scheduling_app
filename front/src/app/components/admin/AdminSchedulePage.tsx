import { AdminGuard } from "./AdminGuard";
import { AdminSchedule } from "./AdminSchedule";

export function AdminSchedulePage() {
  return (
    <AdminGuard>
      <AdminSchedule />
    </AdminGuard>
  );
}
