import { BarChart3, Bell, Boxes, Building2, CalendarDays, ClipboardCheck, LayoutDashboard, Repeat2, Settings, ShieldCheck, UserCircle, Wrench } from "lucide-react";
import type { Role } from "../types";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const allRoles: Role[] = ["Admin", "Asset Manager", "Department Head", "Employee"];
const managers: Role[] = ["Admin", "Asset Manager"];

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: allRoles },
  { label: "Organization Setup", path: "/organization", icon: Building2, roles: ["Admin", "Asset Manager", "Department Head"] },
  { label: "Assets", path: "/assets", icon: Boxes, roles: allRoles },
  { label: "Allocation & Transfer", path: "/allocation", icon: Repeat2, roles: allRoles },
  { label: "Resource Booking", path: "/bookings", icon: CalendarDays, roles: allRoles },
  { label: "Maintenance", path: "/maintenance", icon: Wrench, roles: allRoles },
  { label: "Audit", path: "/audits", icon: ClipboardCheck, roles: ["Admin", "Asset Manager", "Department Head"] },
  { label: "Reports", path: "/reports", icon: BarChart3, roles: allRoles },
  { label: "Notifications", path: "/notifications", icon: Bell, roles: allRoles },
  { label: "Profile", path: "/profile", icon: UserCircle, roles: allRoles },
  { label: "Settings", path: "/settings", icon: Settings, roles: managers },
];

export const routeRoles: Record<string, Role[]> = {
  "/organization": ["Admin"],
  "/organization/departments": ["Admin"],
  "/organization/categories": ["Admin"],
  "/organization/employees": ["Admin"],
  "/assets/new": ["Admin", "Asset Manager"],
  "/audits": ["Admin", "Asset Manager", "Department Head"],
  "/settings": ["Admin", "Asset Manager"],
};

export const roleOptions: Role[] = ["Admin", "Asset Manager", "Department Head", "Employee"];
export const ShieldIcon = ShieldCheck;
