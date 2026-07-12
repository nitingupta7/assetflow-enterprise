import type { Asset, AssetStatus, Booking, Department, MaintenanceRequest, Role } from "../types";
import { apiClient } from "./apiClient";
import { store } from "./store";

export const getName = (id?: string) => store.users.find((user) => user.id === id)?.name ?? "None";
export const getDepartment = (id?: string) => store.departments.find((department) => department.id === id)?.name ?? "--";
export const getCategory = (id?: string) => store.categories.find((category) => category.id === id)?.name ?? "--";
export const getAsset = (id?: string) => store.assets.find((asset) => asset.id === id);

export const authService = {
  login: (email: string) => apiClient.mutate(() => {
    const user = store.users.find((candidate) => candidate.email === email) ?? store.users[0];
    localStorage.setItem("assetflow-auth", user.id);
    return user;
  }),
  signup: (name: string, email: string, departmentId: string) => apiClient.mutate(() => {
    const user = { id: `u-${Date.now()}`, name, email, role: "Employee" as Role, departmentId, status: "Active" as const, avatar: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
    store.users.push(user);
    localStorage.setItem("assetflow-auth", user.id);
    return user;
  }),
  logout: () => apiClient.mutate(() => localStorage.removeItem("assetflow-auth")),
  current: () => apiClient.get(store.users.find((user) => user.id === localStorage.getItem("assetflow-auth")) ?? null),
};

export const dashboardService = {
  get: (role: Role) => apiClient.get({
    role,
    metrics: role === "Employee"
      ? [
          ["My Assets", 2, "/assets"],
          ["My Upcoming Bookings", 3, "/bookings"],
          ["My Pending Requests", 1, "/allocation"],
          ["My Overdue Returns", 1, "/allocation"],
        ]
      : [
          ["Available Assets", 128, "/assets"],
          ["Allocated Assets", 76, "/assets"],
          ["Under Maintenance", 4, "/maintenance"],
          ["Active Bookings", 9, "/bookings"],
          ["Pending Transfers", 3, "/allocation"],
          ["Upcoming Returns", 12, "/allocation"],
        ],
  }),
};

export const organizationService = {
  list: () => apiClient.get({ users: store.users, departments: store.departments, categories: store.categories }),
  addDepartment: (department: Omit<Department, "id">) => apiClient.mutate(() => {
    const item = { ...department, id: `dep-${Date.now()}` };
    store.departments.push(item);
    return item;
  }),
  updateDepartment: (id: string, patch: Partial<Department>) => apiClient.mutate(() => {
    const found = store.departments.find((department) => department.id === id);
    if (found) Object.assign(found, patch);
    return found;
  }),
  changeRole: (id: string, role: Role) => apiClient.mutate(() => {
    const found = store.users.find((user) => user.id === id);
    if (found && role !== "Admin") found.role = role;
    return found;
  }),
};

export const assetService = {
  list: () => apiClient.get(store.assets),
  create: (asset: Omit<Asset, "id" | "tag" | "updatedAt" | "qrValue" | "image">) => apiClient.mutate(() => {
    const next = store.assets.length + 210;
    const created: Asset = {
      ...asset,
      id: `a-${Date.now()}`,
      tag: `AF-${String(next).padStart(4, "0")}`,
      updatedAt: new Date().toISOString(),
      qrValue: `assetflow://assets/${next}`,
      image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80",
    };
    store.assets.unshift(created);
    return created;
  }),
  get: (id: string) => apiClient.get(store.assets.find((asset) => asset.id === id)),
};

export const allocationService = {
  data: () => apiClient.get({ allocations: store.allocations, transfers: store.transfers }),
  allocate: (assetId: string) => apiClient.mutate(() => {
    const asset = getAsset(assetId);
    if (asset?.status === "Allocated") {
      return { ok: false, message: `${asset.tag} is already allocated to ${getName(asset.holderId)} in ${getDepartment(asset.departmentId)}.` };
    }
    return { ok: true, message: "Allocation created." };
  }),
  requestTransfer: (assetId: string, toUserId: string, reason: string) => apiClient.mutate(() => {
    const asset = getAsset(assetId);
    const request = { id: `tr-${Date.now()}`, assetId, fromUserId: asset?.holderId ?? "u-priya", toUserId, requestedById: "u-admin", requestedAt: new Date().toISOString(), status: "Pending" as const, reason };
    store.transfers.unshift(request);
    return request;
  }),
  approveTransfer: (id: string) => apiClient.mutate(() => {
    const transfer = store.transfers.find((item) => item.id === id);
    if (transfer) transfer.status = "Approved";
    return transfer;
  }),
};

export const bookingService = {
  list: () => apiClient.get(store.bookings),
  create: (booking: Omit<Booking, "id" | "status">) => apiClient.mutate(() => {
    const overlaps = store.bookings.some((existing) => existing.assetId === booking.assetId && existing.date === booking.date && existing.status !== "Cancelled" && booking.start < existing.end && existing.start < booking.end);
    if (overlaps) return { ok: false, message: "This time overlaps with an existing booking. Select another slot." };
    const created = { ...booking, id: `b-${Date.now()}`, status: "Upcoming" as const };
    store.bookings.push(created);
    return { ok: true, booking: created };
  }),
  cancel: (id: string) => apiClient.mutate(() => {
    const booking = store.bookings.find((item) => item.id === id);
    if (booking) booking.status = "Cancelled";
    return booking;
  }),
};

export const maintenanceService = {
  list: () => apiClient.get(store.maintenance),
  move: (id: string, status: MaintenanceRequest["status"]) => apiClient.mutate(() => {
    const item = store.maintenance.find((request) => request.id === id);
    if (item) item.status = status;
    return item;
  }),
};

export const auditService = {
  list: () => apiClient.get({ audits: store.audits, results: store.auditResults }),
  updateResult: (id: string, verification: "Verified" | "Missing" | "Damaged" | "Pending") => apiClient.mutate(() => {
    const result = store.auditResults.find((item) => item.id === id);
    if (result) result.verification = verification;
    return result;
  }),
};

export const reportService = {
  data: () => apiClient.get({
    utilization: [{ name: "Engineering", value: 82 }, { name: "Facilities", value: 68 }, { name: "Field Ops", value: 74 }, { name: "Admin", value: 51 }],
    maintenance: [{ month: "Feb", count: 4 }, { month: "Mar", count: 8 }, { month: "Apr", count: 6 }, { month: "May", count: 11 }, { month: "Jun", count: 9 }, { month: "Jul", count: 14 }],
    distribution: [{ name: "Available", value: 128 }, { name: "Allocated", value: 76 }, { name: "Maintenance", value: 4 }],
  }),
};

export const notificationService = {
  list: () => apiClient.get({ notifications: store.notifications, logs: store.activityLogs }),
  markRead: (id: string) => apiClient.mutate(() => {
    const notification = store.notifications.find((item) => item.id === id);
    if (notification) notification.read = true;
    return notification;
  }),
  markAll: () => apiClient.mutate(() => store.notifications.forEach((item) => { item.read = true; })),
};

export const statusTone: Record<AssetStatus | "Active" | "Inactive" | "Pending" | "Approved" | "Rejected" | "Resolved" | "Verified" | "Missing" | "Damaged", string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Allocated: "bg-blue-50 text-blue-700 ring-blue-200",
  Reserved: "bg-violet-50 text-violet-700 ring-violet-200",
  "Under Maintenance": "bg-amber-50 text-amber-700 ring-amber-200",
  Lost: "bg-red-50 text-red-700 ring-red-200",
  Retired: "bg-slate-100 text-slate-700 ring-slate-200",
  Disposed: "bg-zinc-200 text-zinc-800 ring-zinc-300",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-slate-100 text-slate-700 ring-slate-200",
  Pending: "bg-slate-100 text-slate-700 ring-slate-200",
  Approved: "bg-blue-50 text-blue-700 ring-blue-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Missing: "bg-red-50 text-red-700 ring-red-200",
  Damaged: "bg-amber-50 text-amber-700 ring-amber-200",
};
