import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { Role } from "../types";
import { useApp } from "../context/useApp";
import { Card, Loading, PageHeader } from "./ui";

export const ProtectedRoute = () => {
  const { ready, user } = useApp();
  const location = useLocation();
  if (!ready) return <div className="grid min-h-screen place-items-center"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export const RoleGuard = ({ roles, children }: { roles: Role[]; children: ReactNode }) => {
  const { selectedRole } = useApp();
  if (!roles.includes(selectedRole)) {
    return (
      <>
        <PageHeader title="Permission denied" description="Your current demo role cannot access this workspace area." />
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300">Switch to an authorized demo role from the sidebar to preview this module.</p>
        </Card>
      </>
    );
  }
  return <>{children}</>;
};
