import { activityLogs, allocations, assets, auditResults, audits, bookings, categories, departments, maintenance, notifications, transfers, users } from "../data/mockData";

export const delay = <T>(value: T, ms = 180): Promise<T> => new Promise((resolve) => window.setTimeout(() => resolve(value), ms));

export const store = {
  users: [...users],
  departments: [...departments],
  categories: [...categories],
  assets: [...assets],
  allocations: [...allocations],
  transfers: [...transfers],
  bookings: [...bookings],
  maintenance: [...maintenance],
  audits: [...audits],
  auditResults: [...auditResults],
  notifications: [...notifications],
  activityLogs: [...activityLogs],
};
