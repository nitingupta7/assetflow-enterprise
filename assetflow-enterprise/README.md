# AssetFlow - Enterprise Asset & Resource Management System

## Project Vision
**AssetFlow** is a centralized, industry-agnostic Enterprise Resource Planning (ERP) solution designed to eliminate spreadsheet dependency by digitizing physical asset lifecycles, resource bookings, maintenance tickets, and inventory verification audits. Built with performance and concurrency in mind, it provides an uncompromising layer of truth for enterprise asset management.

## Tech Stack
- **Backend:** Node.js, Express.js (Pure JavaScript)
- **Database & ORM:** MySQL with Prisma ORM (Leveraging native MySQL Enums and JSON fields for structured metadata)
- **Frontend:** React.js (Vite, Pure JavaScript/JSX), Tailwind CSS, Lucide React icons

---

## Comprehensive System Architecture & Core Modules

AssetFlow is organized around four distinct user roles, each with explicit workflows to maintain data integrity and security.

### Role Workflows
1. **Admin:** Full system access. Manages users, configures global settings, oversees all assets and locations, and performs hard system overrides when necessary.
2. **Asset Manager:** Responsible for the physical lifecycle of assets. Can approve or deny maintenance requests, execute inventory verification audits, and manage procurement/disposal flows.
3. **Department Head:** Oversees department-specific resources. Approves or denies reservations made by employees within their department and tracks department asset utilization.
4. **Employee:** End-user capable of browsing available assets, submitting resource booking requests, raising maintenance tickets for defective items, and viewing personal allocation history.

### Asset Lifecycle State Machine
Assets transition through a strict, deterministic state machine to ensure operational clarity:
- **Available:** Ready for allocation or reservation.
- **Allocated:** Currently assigned to an employee or department.
- **Reserved:** Booked for a future time slot (unavailable for conflicting dates).
- **Under Maintenance:** Temporarily locked from booking due to repair or inspection.
- **Lost:** Missing following an inventory audit discrepancy.
- **Retired:** Permanently removed from active circulation but kept for historical records.
- **Disposed:** Physically destroyed or sold off, closing the asset lifecycle.

---

## Advanced Business Logic Rules Implemented

AssetFlow implements several strict back-end rules to prevent data corruption and operational chaos:

- **Conflict Prevention Engine:** Utilizes explicit database transaction tracking and row-level locking to prevent the double-allocation of items, eliminating race conditions during high-volume booking periods.
- **Overlap Validation Calendar Engine:** Employs strict time-slot mathematical checks that allow back-to-back resource bookings while hard-blocking any overlaps, ensuring smooth transitions of shared assets.
- **Maintenance State Cascades:** When a repair is approved, the system automatically cascades the state of the asset, locking it from future bookings and unlocking it only upon maintenance ticket resolution.
- **Inventory Audit Cycle & Discrepancy Flow:** Active audit cycles compile real-time discrepancy logs. Upon closure of the cycle, the system automatically executes batch status shifts (e.g., automatically marking unverified items as 'Lost' or moving flagged items to 'Under Maintenance').
- **Overdue Return Monitor:** Live operational tracking continuously monitors active allocations and flags assets kept past their expected return dates, alerting both the responsible employee and their Department Head.

---

## 4-Person Git & Parallel Directory Architecture

To mitigate merge conflicts and enable seamless parallel development during the hackathon, we implemented a strictly isolated file namespace architecture mapping specific directories to individual developers.

```text
AssetFlow/
├── backend/
│   ├── /controllers    <-- Developer 1 (API Logic & Core Rules)
│   ├── /middleware     <-- Developer 1 (Auth & Validation)
│   ├── /routes         <-- Developer 2 (API Routing & Schema)
│   └── /prisma         <-- Developer 2 (Database schema & Migrations)
└── frontend/
    ├── /src/components <-- Developer 3 (React UI & Tailwind Views)
    └── /src/context    <-- Developer 4 (Global State & API Integration)
```

**Developer Responsibilities:**
- **Developer 1:** Focused on pure backend business logic, validation engines, and transaction safety.
- **Developer 2:** Managed the database schema, Prisma migrations, and API route definitions.
- **Developer 3:** Built the responsive frontend UI components and complex interactive dashboards.
- **Developer 4:** Handled frontend state management, authentication flows, and backend API integration.

---

## Local Installation & Zero-Configuration Offline Quickstart Guide

AssetFlow is designed to be run entirely locally without complex cloud dependencies. Follow these steps to get started immediately.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/assetflow.git
cd assetflow

# 2. Setup the backend environment
cd backend
cp .env.example .env
# Ensure your .env contains a valid MySQL local connection string:
# DATABASE_URL="mysql://root:password@localhost:3306/assetflow"

# 3. Install backend dependencies
npm install

# 4. Initialize database tables and apply schema
npx prisma migrate dev --name init

# 5. Seed the database with initial dummy data (Optional but recommended)
npx prisma db seed

# 6. Start the backend development server
npm run dev
```

In a separate terminal window:

```bash
# 7. Setup and start the frontend client
cd assetflow/frontend
npm install
npm run dev
```
The client will be available at `http://localhost:5173` and the API will run on `http://localhost:3000`.

---

## Evaluation Matrix Compliance Check

| Evaluation Criteria | Implementation Details | Status |
| :--- | :--- | :---: |
| **No Static JSON Data** | Full real-time MySQL CRUD operations integrated seamlessly via Prisma ORM. | ✅ |
| **Robust Input Validation** | Strict Express schema validation layers protecting all API endpoints. | ✅ |
| **Responsive & Clean UI** | Consistent Tailwind utility classes providing a modern, fluid layout design across devices. | ✅ |
| **Offline / Local Capability** | Entirely self-contained local stack with no mandatory external cloud dependencies. | ✅ |
| **Proper Git Version Control**| Isolated file namespaces per developer minimizing merge clashes and ensuring clean commit history. | ✅ |
