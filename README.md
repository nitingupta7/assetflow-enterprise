<div align="center">

# 🏢 AssetFlow

### Enterprise Asset & Resource Management System

*Replacing spreadsheets and paper logs with structured lifecycles, role-based workflows, and real-time visibility — for any organization with equipment, vehicles, furniture, or shared spaces to track.*

<br />

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)
![Status](https://img.shields.io/badge/status-in%20development-orange?style=for-the-badge)

<!--
**[🌐 Live Demo](#)** &nbsp;·&nbsp; **[🐛 Report Bug](../../issues)** &nbsp;·&nbsp; **[✨ Request Feature](../../issues)**
-->

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Roles and Permissions](#-roles-and-permissions)
- [Asset Lifecycle](#-asset-lifecycle)
- [Core Business Logic](#-core-business-logic)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)

---

## 🎯 About

AssetFlow is a centralized ERP module for tracking physical assets and shared resources end to end: registration, allocation, booking, maintenance, and audit. It's industry-agnostic — any organization with equipment, furniture, vehicles, or shared spaces (offices, schools, hospitals, factories) can use it to replace manual, spreadsheet-based tracking with structured workflows and real-time visibility into who holds what, where it is, and its condition.

**In scope:** asset lifecycle tracking, allocation/transfer/return, resource booking with conflict prevention, maintenance approval workflows, audit cycles, role-based access, notifications, and analytics.

**Out of scope:** purchasing, invoicing, and accounting. Acquisition cost is tracked as a reporting field only — it never feeds a ledger.

**Core modules:** Login/Signup · Dashboard · Organization Setup · Asset Registration & Directory · Allocation & Transfer · Resource Booking · Maintenance · Audit Cycles · Reports & Analytics · Activity Logs & Notifications.

📄 Full technical spec — schema, complete API surface, state machine, RBAC matrix: [`AssetFlow_Architecture_Spec.md`](./AssetFlow_Architecture_Spec.md)

---

## ✨ Features

- 🔐 **Realistic RBAC** — four roles (Admin, Asset Manager, Department Head, Employee), zero self-elevation; signup only ever creates an Employee
- 📦 **Full asset lifecycle** — 7 states, QR-code search, photo/document uploads, per-asset activity timeline
- ⚡ **Conflict-safe allocation** — double-allocation is impossible at the database layer, not just checked in application code
- 📅 **Overlap-free booking** — calendar-based resource booking with mathematically precise, back-to-back-friendly overlap validation
- 🔧 **Approval-gated maintenance** — requests must be approved before work starts; asset status updates automatically
- 🔍 **Structured audit cycles** — scoped verification runs with auto-generated discrepancy reports
- 📊 **Role-aware dashboard** — every role sees a KPI snapshot scoped to what's relevant to them
- 🔔 **Notifications + full activity log** — nothing happens silently

**Planned differentiators:** see [Roadmap](#-roadmap).

---

## 🧰 Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Lucide React icons |
| Forms/Validation | React Hook Form + Zod |
| Data fetching | TanStack Query |
| Calendar | FullCalendar |
| Charts | Recharts |
| Backend | Node.js + Express (monolithic REST API) |
| ORM | Prisma |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| Auth | JWT (access + refresh) + bcrypt |
| File storage | [Cloudinary](https://cloudinary.com) |
| Deployment | Vercel (frontend) · Render (backend) · Neon (database) |

PostgreSQL was chosen deliberately: two of the hardest requirements — no double-allocation, no overlapping bookings — are enforced at the **database layer** using partial unique indexes and GiST exclusion constraints, features Postgres has that document/key-value stores don't offer natively.

---

## 📸 Screenshots

> UI is in active development — screenshots and a demo GIF will be added here once the core screens are built.
>
> Planned captures: **Dashboard** · **Asset Directory** · **Booking Calendar** · **Audit Discrepancy Report**

<!--
![Dashboard](./docs/screenshots/dashboard.png)
![Asset Directory](./docs/screenshots/asset-directory.png)
-->

---

## 📐 Architecture

```text
React + Vite + TS (Vercel)
        │  REST API, JWT bearer
        ▼
Express API (Render)
Controllers → Services → Prisma
        │
   ┌────┴─────┐
   ▼          ▼
PostgreSQL   Cloudinary
 (Neon)     (photos/docs)
```

---

## 🔐 Roles and Permissions

| Role | Key Responsibilities |
|---|---|
| 🛡️ **Admin** | Organization Setup (departments, categories) · the only path to promoting Department Heads/Asset Managers · creates & closes Audit Cycles · org-wide analytics |
| 🔧 **Asset Manager** | Registers & allocates assets · approves transfers, returns, and maintenance requests — **org-wide**, not department-scoped |
| 🏢 **Department Head** | Views/manages department-scoped assets · approves transfer requests within the department · books resources on the department's behalf |
| 👤 **Employee** | Views own assets · books resources directly (overlap-checked, no approval needed) · raises maintenance requests · initiates transfer/return requests |

Full permission matrix (every action × every role): [`AssetFlow_Architecture_Spec.md`](./AssetFlow_Architecture_Spec.md)

---

## 🔄 Asset Lifecycle

| State | Meaning |
|---|---|
| 🟢 Available | Unassigned, ready for allocation or booking |
| 🔵 Allocated | Held by an employee/department; blocks new direct allocation |
| 🟡 Reserved | *Computed, not stored* — shown only while a bookable asset has a booking covering right now |
| 🔧 Under Maintenance | Locked during repair; reverts to prior holder (if any) or Available on resolution |
| 🔴 Lost | Set automatically when an audit cycle closes with this asset marked Missing |
| ⚪ Retired | Removed from active circulation, kept for records |
| ⚫ Disposed | Final, archived state |

---

## 🔒 Core Business Logic

- **Conflict Prevention** — a partial unique index guarantees the database will never allow two active allocations on one asset, even under a race; the API surfaces the current holder so the UI can offer a Transfer Request instead of a dead end.
- **Overlap Validation** — half-open interval math allows back-to-back bookings while hard-blocking true overlaps, backed by a PostgreSQL GiST exclusion constraint so the guarantee holds even under simultaneous requests.
- **Maintenance Cascades** — approving a request flips the asset to Under Maintenance; if it was already Allocated, that allocation stays open, so resolution returns it to its *original* holder.
- **Audit Discrepancy Flow** — each cycle snapshots its in-scope assets at creation. Missing → asset auto-flips to Lost on close; Damaged → auto-drafts a maintenance ticket for triage.
- **Overdue Monitor** — computed live for dashboards; a daily job fires a one-time notification the moment an allocation crosses its expected return date.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database — local install, or a free [Neon](https://neon.tech) branch (recommended, skips local setup entirely)
- A free [Cloudinary](https://cloudinary.com) account (asset photos/documents)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SachinRajput02/assetflow.git
cd assetflow

# 2. Backend setup
cd backend
cp .env.example .env
npm install
```

<details>
<summary>Environment variables (click to expand)</summary>

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetflow"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```
</details>

```bash
# 3. Apply schema and seed data
# (seed includes the one bootstrapped Admin account — Admin is never created via signup)
npx prisma migrate dev --name init
npx prisma db seed

# 4. Start the backend
npm run dev
```

In a second terminal:

```bash
# 5. Frontend setup
cd assetflow/frontend
npm install
npm run dev
```

App: `http://localhost:5173` · API: `http://localhost:3000`

---

## 📁 Project Structure

```text
assetflow/
├── backend/
│   ├── controllers/     # Request handlers, one per module
│   ├── services/        # Business logic — conflict rules, state transitions
│   ├── routes/          # API route definitions
│   ├── middleware/      # JWT auth, RBAC guards
│   ├── validators/      # Zod request schemas
│   └── prisma/          # Schema, migrations, seed data
└── frontend/
    └── src/
        ├── pages/        # The 10 core screens
        ├── components/   # Shared UI, shadcn primitives
        ├── hooks/        # TanStack Query hooks, per module
        ├── services/     # API client layer
        └── context/      # Auth/session context
```

---

## 🔌 API Overview

A representative sample — full endpoint list in the architecture spec.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create an Employee account |
| POST | `/auth/login` | Authenticate, issue JWT |
| GET | `/assets` | Search/filter the asset directory |
| POST | `/allocations` | Allocate an asset (409 on conflict) |
| POST | `/transfers/:id/approve` | Approve a transfer request |
| POST | `/bookings` | Create a booking (overlap-checked) |
| POST | `/maintenance/:id/approve` | Approve a maintenance request |
| POST | `/audit-cycles/:id/close` | Close an audit cycle, apply status shifts |
| GET | `/dashboard/kpis` | Role-aware KPI snapshot |

Full surface (~50 endpoints across 10 modules): [`AssetFlow_Architecture_Spec.md`](./AssetFlow_Architecture_Spec.md)

---

## 🚧 Roadmap

- [ ] Natural-language AI assistant for asset queries (function-calling over the schema)
- [ ] Real-time notifications via Socket.io
- [ ] Predictive maintenance risk scoring
- [ ] Mobile-friendly QR scan-to-profile flow
- [ ] PDF export for audit and utilization reports

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

---

## 👥 Team

Built by:

- **Nitin Gupta** — [@nitingupta7](https://github.com/nitingupta7)
- **Sachin Kumar** — [@SachinRajput02](https://github.com/SachinRajput02)
- **Aditya Kumar Mishra** — [@ADITYAKUMARMISHRAG](https://github.com/ADITYAKUMARMISHRAG)
- **Ishan Saxena** — [@ishan145](https://github.com/ishan145)

<div align="center">

⭐ If this project is useful to you, consider starring the repo!

</div>
