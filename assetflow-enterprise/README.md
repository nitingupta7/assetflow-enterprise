# AssetFlow: Enterprise Asset & Resource Management System

## 📋 Overview
**AssetFlow** is a centralized ERP platform designed to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources. The platform is industry-agnostic and built to replace manual tracking inefficiencies (such as spreadsheets and paper logs) with structured asset lifecycles, centralized resource booking, and real-time visibility into who holds what, where it is, and its condition. AssetFlow delivers core ERP functionality using a clean architecture and role-based workflows, explicitly excluding purchasing, invoicing, or accounting concerns.

---

## 🚀 Key Features

### 1. Authentication & Onboarding
* **Secure Signup/Login**: Users authenticate using an email and password, complete with forgot password and session validation workflows. 
* **Non-Self-Elevating Roles**: Signup defaults strictly to a standard Employee account; users cannot self-assign administrative privileges.
* **Role Promotion**: System Administrators manage and promote Employees to Department Heads or Asset Managers directly from the Employee Directory.

### 2. Operational Dashboard
* **Real-Time KPIs**: Track system metrics via specialized KPI cards including *Assets Available*, *Assets Allocated*, *Maintenance Today*, *Active Bookings*, *Pending Transfers*, and *Upcoming Returns*.
* **Intelligent Alerts**: Overdue asset returns (past their Expected Return Date) are explicitly highlighted separately from upcoming ones.
* **Quick Actions**: Immediate dashboard access to register an asset, book a resource, or raise a maintenance request.

### 3. Organization Setup (Admin Only)
The setup dashboard is split into 3 core tabs:
* **Tab A - Department Management**: Tools to create, edit, or deactivate departments, assign Department Heads, configure hierarchical parent departments, and toggle active status.
* **Tab B - Asset Category Management**: System-wide configuration for categories (e.g., Electronics, Furniture, Vehicles) supporting category-specific custom fields like warranty periods.
* **Tab C - Employee Directory**: Central hub mapping employee profiles (Name, Email, Department, Role, Status) and the exclusive interface for role promotions.

### 4. Asset Registration & Full Directory
* **Detailed Tracking**: Register physical assets with comprehensive fields including Asset Tag (auto-generated, e.g., `AF-0001`), Serial Number, Acquisition Date, Acquisition Cost (for ranking/reports only), Condition, Location, documentation attachments, and a "shared/bookable" flag.
* **Advanced Filtering**: Search and filter options by Asset Tag, Serial Number, QR code, category, status, department, or location.
* **Historical Logs**: Each asset maintains an independent history for allocations and maintenance activities.

### 5. Conflict-Free Allocation & Transfers
* **Double-Allocation Prevention**: Assets cannot be allocated if they are already assigned. If an asset is unavailable, the system blocks the request, identifies the current holder, and redirects the user to initiate a Transfer Request.
* **Transfer & Return Workflows**: Supports a multi-stage transfer flow (Requested -> Approved by Manager/Head -> Re-allocated) and a return flow that captures condition check-in notes before reverting the asset status to *Available*.

### 6. Overlap-Validated Resource Booking
* **Calendar View**: A visual timeline showing existing reservations for shared resources (rooms, vehicles, equipment).
* **Strict Overlap Prevention**: The booking engine automatically rejects time-slot collisions (e.g., a slot already reserved for 9:00–10:00 will block a 9:30–10:30 request, but permit a 10:00–11:00 booking).
* **Lifecycle Tracking**: Monitor booking statuses through *Upcoming*, *Ongoing*, *Completed*, and *Cancelled* states, complete with automated pre-slot reminder notifications.

### 7. Structured Maintenance Approval
* **Request Pipeline**: Employees can flag equipment issues by selecting the asset, describing the problem, choosing a priority level, and attaching supporting photos.
* **Automated Status Shifting**: Upon Manager approval, the asset state automatically updates to *Under Maintenance* and locks down until resolved, flipping back to *Available* upon completion.

### 8. Verification Audit Cycles
* **Targeted Audits**: Administrators define audit cycles restricted by specific departments, locations, and date ranges.
* **Discrepancy Reporting**: Designated auditors evaluate scoped items, marking them as *Verified*, *Missing*, or *Damaged*. The system auto-generates a discrepancy report for further action.
* **Cycle Lock**: Closing an audit cycle permanently records the logs and automatically updates affected asset statuses (e.g., changing confirmed-missing items to *Lost*).

### 9. Analytics, Activity Logs & Notifications
* **Operational Insights**: Out-of-the-box tracking for asset utilization trends, maintenance frequency, retirement horizons, department distribution, and peak-usage resource heatmaps.
* **Comprehensive Logs & Alerts**: System-wide activity logs record who performed what action and when. Real-time alerts notify users about assignments, approvals, approaching slots, overdue allocations, and discovered discrepancies.

---

## 🔄 Asset Lifecycle States

Assets dynamically transition across the following explicit operational states based on system workflows:
* `Available`: Free for allocation or resource booking.
* `Allocated`: Currently assigned to an employee or department.
* `Reserved`: Held for an upcoming scheduled booking slot.
* `Under Maintenance`: Undergoing authorized repairs; unavailable for deployment.
* `Lost`: Confirmed missing following an audit cycle discrepancy.
* `Retired`: Nearing the end of operational utility.
* `Disposed`: Permanently removed from organization inventory.

---

## 👥 User Roles & Permissions Matrix

| Role | Core Responsibilities & Permissions |
| :--- | :--- |
| **Admin** | Configures master data (departments, asset categories), promotes employee roles, sets up audit cycles, and views organization-wide analytics. |
| **Asset Manager** | Registers/allocates inventory, handles condition check-in notes, and holds authority to approve asset returns, transfers, maintenance requests, and audit discrepancies. |
| **Department Head** | Monitors assets allocated to their specific department, approves intra-department transfers/allocations, and books shared resources on behalf of their department. |
| **Employee** | Views their personally allocated assets, reserves shared resources, raises maintenance requests, and initiates return or transfer workflows. |

---

## 🔗 Mockup (Proof of Concept)
Review the system layout and UI flow details on the official project mockup workspace:  
👉 [Excalidraw POC Board](https://app.excalidraw.com/I/65VNwvy7c4X/5ceOBMjbDby)
