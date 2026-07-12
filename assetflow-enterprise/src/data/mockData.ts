import type { ActivityLog, Allocation, Asset, AssetCategory, AuditCycle, AuditResult, Booking, Department, MaintenanceRequest, Notification, TransferRequest, User } from "../types";

export const departments: Department[] = [
  { id: "dep-eng", name: "Engineering", headId: "u-aditi", status: "Active" },
  { id: "dep-fac", name: "Facilities", headId: "u-rohan", status: "Active" },
  { id: "dep-ops", name: "Field Ops", headId: "u-sana", status: "Active" },
  { id: "dep-east", name: "Field Ops East", headId: "u-sana", parentId: "dep-ops", status: "Inactive" },
];

export const users: User[] = [
  { id: "u-admin", name: "Nina Admin", email: "admin@assetflow.test", role: "Admin", departmentId: "dep-eng", status: "Active", avatar: "NA" },
  { id: "u-manager", name: "Rohan Mehta", email: "rohan@assetflow.test", role: "Asset Manager", departmentId: "dep-fac", status: "Active", avatar: "RM" },
  { id: "u-aditi", name: "Aditi Rao", email: "aditi@assetflow.test", role: "Department Head", departmentId: "dep-eng", status: "Active", avatar: "AR" },
  { id: "u-sana", name: "Sana Iqbal", email: "sana@assetflow.test", role: "Department Head", departmentId: "dep-east", status: "Active", avatar: "SI" },
  { id: "u-priya", name: "Priya Shah", email: "priya@assetflow.test", role: "Employee", departmentId: "dep-eng", status: "Active", avatar: "PS" },
  { id: "u-arjun", name: "Arjun Nair", email: "arjun@assetflow.test", role: "Employee", departmentId: "dep-fac", status: "Active", avatar: "AN" },
];

export const categories: AssetCategory[] = [
  { id: "cat-elec", name: "Electronics", warrantyMonths: 36, maintenanceCycleDays: 180, expectedLifeMonths: 48, status: "Active" },
  { id: "cat-furn", name: "Furniture", warrantyMonths: 12, maintenanceCycleDays: 365, expectedLifeMonths: 84, status: "Active" },
  { id: "cat-room", name: "Rooms", warrantyMonths: 0, maintenanceCycleDays: 90, expectedLifeMonths: 120, status: "Active" },
  { id: "cat-veh", name: "Vehicles", warrantyMonths: 24, maintenanceCycleDays: 60, expectedLifeMonths: 72, status: "Active" },
];

export const assets: Asset[] = [
  { id: "a-0012", tag: "AF-0012", name: "Dell Laptop", serialNumber: "DL-9X23", categoryId: "cat-elec", departmentId: "dep-eng", status: "Allocated", location: "Bengaluru", holderId: "u-priya", updatedAt: "2026-07-12T10:30:00", acquisitionDate: "2022-03-12", acquisitionCost: 92000, condition: "Good", isBookable: false, qrValue: "assetflow://assets/a-0012", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80" },
  { id: "a-0062", tag: "AF-0062", name: "Projector", serialNumber: "PRJ-7781", categoryId: "cat-elec", departmentId: "dep-fac", status: "Under Maintenance", location: "HQ Floor 2", updatedAt: "2026-07-12T08:12:00", acquisitionDate: "2021-09-08", acquisitionCost: 56000, condition: "Fair", isBookable: true, qrValue: "assetflow://assets/a-0062", image: "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=900&q=80" },
  { id: "a-0201", tag: "AF-0201", name: "Office Chair", serialNumber: "CHR-201", categoryId: "cat-furn", departmentId: "dep-fac", status: "Available", location: "Warehouse", updatedAt: "2026-07-10T11:01:00", acquisitionDate: "2024-01-04", acquisitionCost: 9000, condition: "Good", isBookable: false, qrValue: "assetflow://assets/a-0201", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80" },
  { id: "a-room", tag: "ROOM-B2", name: "Conference Room B2", serialNumber: "B2-HQ", categoryId: "cat-room", departmentId: "dep-fac", status: "Reserved", location: "HQ Floor 2", updatedAt: "2026-07-12T09:00:00", acquisitionDate: "2020-01-01", acquisitionCost: 0, condition: "Good", isBookable: true, qrValue: "assetflow://assets/a-room", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80" },
  { id: "a-0114", tag: "AF-0114", name: "Dell Laptop", serialNumber: "DL-0114", categoryId: "cat-elec", departmentId: "dep-eng", status: "Allocated", location: "Bengaluru", holderId: "u-priya", updatedAt: "2026-07-12T10:34:00", acquisitionDate: "2023-03-12", acquisitionCost: 88000, condition: "Good", isBookable: false, qrValue: "assetflow://assets/a-0114", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80" },
];

export const allocations: Allocation[] = [
  { id: "al-1", assetId: "a-0114", holderId: "u-priya", departmentId: "dep-eng", allocatedDate: "2026-03-12", expectedReturnDate: "2026-07-09", status: "Active", notes: "Engineering workstation" },
  { id: "al-2", assetId: "a-0012", holderId: "u-priya", departmentId: "dep-eng", allocatedDate: "2026-04-01", expectedReturnDate: "2026-08-10", status: "Active", notes: "Sprint delivery laptop" },
  { id: "al-3", assetId: "a-0201", holderId: "u-arjun", departmentId: "dep-fac", allocatedDate: "2026-01-04", expectedReturnDate: "2026-02-04", status: "Returned", notes: "Condition good" },
];

export const transfers: TransferRequest[] = [
  { id: "tr-1", assetId: "a-0012", fromUserId: "u-priya", toUserId: "u-arjun", requestedById: "u-aditi", requestedAt: "2026-07-12T09:00:00", status: "Pending", reason: "Temporary facilities support" },
];

export const bookings: Booking[] = [
  { id: "b-1", assetId: "a-room", bookedById: "u-manager", departmentId: "dep-fac", date: "2026-07-12", start: "09:00", end: "10:00", purpose: "Procurement Team", status: "Upcoming" },
  { id: "b-2", assetId: "a-room", bookedById: "u-priya", departmentId: "dep-eng", date: "2026-07-12", start: "14:00", end: "15:00", purpose: "Design review", status: "Upcoming" },
];

export const maintenance: MaintenanceRequest[] = [
  { id: "m-1", assetId: "a-0062", issue: "Projector bulb not turning on", priority: "High", raisedById: "u-priya", createdAt: "2026-07-10", status: "Pending" },
  { id: "m-2", assetId: "a-ac", issue: "AC unit noisy compressor", priority: "Medium", raisedById: "u-aditi", createdAt: "2026-07-09", status: "Approved" },
  { id: "m-3", assetId: "a-fork", issue: "Forklift inspection", priority: "Critical", raisedById: "u-manager", createdAt: "2026-07-07", technician: "R. Verma", status: "Technician Assigned" },
  { id: "m-4", assetId: "a-prn", issue: "Printer jam, parts ordered", priority: "Medium", raisedById: "u-arjun", createdAt: "2026-07-06", status: "In Progress" },
  { id: "m-5", assetId: "a-chair", issue: "Chair repair resolved 7 Jul", priority: "Low", raisedById: "u-sana", createdAt: "2026-07-02", status: "Resolved" },
];

export const audits: AuditCycle[] = [
  { id: "au-1", name: "Q3 Audit: Engineering Department", scopeDepartmentId: "dep-eng", scopeLocation: "Bengaluru", startDate: "2026-07-01", endDate: "2026-07-15", auditorIds: ["u-aditi", "u-sana"], status: "Active" },
];

export const auditResults: AuditResult[] = [
  { id: "ar-1", auditId: "au-1", assetId: "a-0012", expectedLocation: "Desk E12", auditorId: "u-aditi", verification: "Verified", notes: "Matched QR", checkedAt: "2026-07-05" },
  { id: "ar-2", auditId: "au-1", assetId: "a-9921", expectedLocation: "Desk E14", auditorId: "u-sana", verification: "Missing", notes: "Not at assigned desk", checkedAt: "2026-07-06" },
  { id: "ar-3", auditId: "au-1", assetId: "a-9838", expectedLocation: "Desk E15", auditorId: "u-aditi", verification: "Damaged", notes: "Cracked stand", checkedAt: "2026-07-06" },
];

export const notifications: Notification[] = [
  { id: "n-1", type: "Activity", message: "Laptop AF-0014 assigned to Priya Shah", timestamp: "2m ago", read: false, entityPath: "/assets/a-0114" },
  { id: "n-2", type: "Approval", message: "Maintenance request AF-0055 approved", timestamp: "18m ago", read: false, entityPath: "/maintenance" },
  { id: "n-3", type: "Booking", message: "Booking confirmed: Room B2, 2:00-3:00 PM", timestamp: "1h ago", read: true, entityPath: "/bookings" },
  { id: "n-4", type: "Approval", message: "Transfer approved: AF-0033 to Facilities", timestamp: "3h ago", read: true, entityPath: "/allocation" },
  { id: "n-5", type: "Alert", message: "Overdue return: AF-0021 was due three days ago", timestamp: "1d ago", read: false, entityPath: "/allocation" },
  { id: "n-6", type: "Alert", message: "Audit discrepancy: AF-0088 damaged", timestamp: "2d ago", read: false, entityPath: "/audits/au-1" },
];

export const activityLogs: ActivityLog[] = [
  { id: "log-1", userId: "u-manager", entityId: "a-0114", action: "ASSET_ALLOCATED", description: "Laptop AF-0114 allocated to Priya Shah - IT dept", timestamp: "2026-07-12T10:20:00" },
  { id: "log-2", userId: "u-priya", entityId: "a-room", action: "BOOKING_CONFIRMED", description: "Room B2 booking confirmed - 2:00 to 3:00 PM", timestamp: "2026-07-12T09:30:00" },
  { id: "log-3", userId: "u-manager", entityId: "a-0062", action: "MAINTENANCE_RESOLVED", description: "Projector AF-0062 maintenance resolved", timestamp: "2026-07-11T16:00:00" },
  { id: "log-4", userId: "u-arjun", entityId: "a-0201", action: "ASSET_RETURNED", description: "Office chair returned by Arjun Nair - condition good", timestamp: "2026-01-04T12:00:00" },
];
