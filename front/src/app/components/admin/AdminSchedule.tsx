import { AdminDashboard } from "./AdminDashboard";

export function AdminSchedule() {
  // 这个组件复用 AdminDashboard，但初始显示排班标签页
  return <AdminDashboard initialTab="schedule" />;
}
