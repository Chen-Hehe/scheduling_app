import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { MemberProvider } from "./context/MemberContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <MemberProvider>
      <AdminAuthProvider>
        <ScheduleProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </ScheduleProvider>
      </AdminAuthProvider>
    </MemberProvider>
  );
}