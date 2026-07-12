export type Role = "Admin" | "Asset Manager" | "Department Head" | "Employee";
export type Status = "Active" | "Inactive";
export type AssetStatus = "Available" | "Allocated" | "Reserved" | "Under Maintenance" | "Lost" | "Retired" | "Disposed";
export type Condition = "New" | "Good" | "Fair" | "Poor" | "Damaged";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string;
  status: Status;
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  parentId?: string;
  status: Status;
}

export interface AssetCategory {
  id: string;
  name: string;
  warrantyMonths: number;
  maintenanceCycleDays: number;
  expectedLifeMonths: number;
  status: Status;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  serialNumber: string;
  categoryId: string;
  departmentId: string;
  status: AssetStatus;
  location: string;
  holderId?: string;
  updatedAt: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: Condition;
  isBookable: boolean;
  qrValue: string;
  image: string;
}

export interface Allocation {
  id: string;
  assetId: string;
  holderId: string;
  departmentId: string;
  allocatedDate: string;
  expectedReturnDate: string;
  status: "Active" | "ReturnRequested" | "Returned" | "Transferred";
  notes: string;
}

export interface TransferRequest {
  id: string;
  assetId: string;
  fromUserId: string;
  toUserId: string;
  requestedById: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export interface Booking {
  id: string;
  assetId: string;
  bookedById: string;
  departmentId?: string;
  date: string;
  start: string;
  end: string;
  purpose: string;
  status: "Upcoming" | "Cancelled";
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  issue: string;
  priority: Priority;
  raisedById: string;
  createdAt: string;
  technician?: string;
  status: "Pending" | "Approved" | "Technician Assigned" | "In Progress" | "Resolved" | "Rejected";
}

export interface AuditCycle {
  id: string;
  name: string;
  scopeDepartmentId: string;
  scopeLocation: string;
  startDate: string;
  endDate: string;
  auditorIds: string[];
  status: "Draft" | "Active" | "Closed";
}

export interface AuditResult {
  id: string;
  auditId: string;
  assetId: string;
  expectedLocation: string;
  auditorId: string;
  verification: "Verified" | "Missing" | "Damaged" | "Pending";
  notes: string;
  checkedAt?: string;
}

export interface Notification {
  id: string;
  type: "Alert" | "Approval" | "Booking" | "Activity";
  message: string;
  timestamp: string;
  read: boolean;
  entityPath: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  entityId: string;
  action: string;
  description: string;
  timestamp: string;
}
