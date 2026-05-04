import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { ReactNode } from "react";

export function PrivateUserRoute({ children }: { children: ReactNode }) {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function PrivateAdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
