import { createBrowserRouter } from "react-router";
import { Screen1BasicInfo } from "./components/Screen1BasicInfo";
import { Screen2ShiftSelect } from "./components/Screen2ShiftSelect";
import { Screen3Priority } from "./components/Screen3Priority";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminDashboardPage } from "./components/admin/AdminDashboardPage";
import { AdminSchedulePage } from "./components/admin/AdminSchedulePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Screen1BasicInfo,
  },
  {
    path: "/shift-select",
    Component: Screen2ShiftSelect,
  },
  {
    path: "/priority",
    Component: Screen3Priority,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboardPage,
  },
  {
    path: "/admin/schedule",
    Component: AdminSchedulePage,
  },
]);
