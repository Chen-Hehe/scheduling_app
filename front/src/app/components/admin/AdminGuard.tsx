import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAdminAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/admin/login", { replace: true });
    } else {
      setChecked(true);
    }
  }, [isLoggedIn, navigate]);

  if (!checked) return null;
  return <>{children}</>;
}
