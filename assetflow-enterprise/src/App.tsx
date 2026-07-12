import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute, RoleGuard } from "./components/guards";
import { LoginPage, SignupPage, ForgotPasswordPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { AssetDetailPage, AssetsPage, NewAssetPage } from "./pages/AssetsPage";
import { AllocationPage, AuditDetailPage, AuditListPage, BookingPage, MaintenancePage, NotFoundPage, NotificationsPage, ProfilePage, ReportsPage, SettingsPage } from "./pages/WorkflowPages";

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organization" element={<RoleGuard roles={["Admin"]}><OrganizationPage /></RoleGuard>} />
        <Route path="/organization/departments" element={<RoleGuard roles={["Admin"]}><OrganizationPage /></RoleGuard>} />
        <Route path="/organization/categories" element={<RoleGuard roles={["Admin"]}><OrganizationPage /></RoleGuard>} />
        <Route path="/organization/employees" element={<RoleGuard roles={["Admin"]}><OrganizationPage /></RoleGuard>} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/new" element={<RoleGuard roles={["Admin", "Asset Manager"]}><NewAssetPage /></RoleGuard>} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/allocation" element={<AllocationPage />} />
        <Route path="/bookings" element={<BookingPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audits" element={<RoleGuard roles={["Admin", "Asset Manager", "Department Head"]}><AuditListPage /></RoleGuard>} />
        <Route path="/audits/:id" element={<RoleGuard roles={["Admin", "Asset Manager", "Department Head"]}><AuditDetailPage /></RoleGuard>} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<RoleGuard roles={["Admin", "Asset Manager"]}><SettingsPage /></RoleGuard>} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
