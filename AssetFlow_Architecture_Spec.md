# AssetFlow — Final Solution Architecture & Flow (Confirmed Draft v1)

Status: **ready for your review.** This reconciles the official problem statement (authoritative) with your earlier draft discussion. Section 10 lists everything you should explicitly confirm before we move to schema/code.

---

## 0. Scope Lock

**In scope:** Auth/RBAC, Org Setup (Departments/Categories/Employees), Asset Registry + lifecycle, Allocation/Transfer/Return, Resource Booking, Maintenance workflow, Audit Cycles, Reports/Analytics, Notifications + Activity Logs. Four roles: Admin, Asset Manager, Department Head, Employee.

**Explicitly out of scope:** purchasing, invoicing, accounting. `acquisition_cost` on an asset is a reporting field only — it never feeds a ledger.

**Non-negotiable constraint:** nobody can self-elevate. Signup only ever creates an Employee. Admin is the only path to Department Head / Asset Manager, and that path is singular (Employee Directory, Screen 3C) — no other screen assigns a role.

---

## 1. What Changed From Your Draft Discussion

Your earlier breakdown was solid and I kept ~90% of it. Six corrections worth knowing about before you build:

1. **Bookable resources are Assets, not a separate entity.** Your draft treated Resource Booking as "separate from assets." The actual PDF lists `"shared/bookable" flag` as an *asset registration field* (Screen 4). A meeting room or vehicle is a row in `assets` with `is_bookable = true` — one registry, one search screen, one QR system for everything.
2. **QR code is a core requirement, not a bonus.** The PDF explicitly names QR as a *search/filter* field on the Asset Directory ("Search/filter by Asset Tag, Serial Number, **QR code**..."). Your draft filed it under "wow ideas." Build it in Week 1, not Day 7.
3. **"Digital Twin" / "Timeline" aren't extra features** — they're just the Asset Detail screen (Screen 4) done properly. Reframed under core execution, not differentiators.
4. **Role promotion is stricter than your draft assumed.** Assigning someone as a *Department's* head (Screen 3A) should only let you pick from users who are *already* Department Head by role (promoted first in 3C) — not a second, parallel place where roles get set. This is what "this is the only place roles are assigned" is protecting.
5. **"Reserved" is a computed state, not a stored one** (details in §4) — a bookable room has many time slots, so a single stored flag on the asset can't represent availability correctly.
6. **Transfer vs. Return are now distinct closure types** on an allocation (`Transferred` vs `Returned`) so your reports can tell "asset went back to pool" apart from "asset went straight to someone else."

---

## 2. Confirmed Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast DX, no SSR complexity you don't need |
| UI | Tailwind + shadcn/ui + Lucide icons | Enterprise look with low effort |
| Forms/Validation | React Hook Form + Zod | Needed everywhere — every module has a form |
| Data fetching | TanStack Query + Context (no Redux) | This app is 90% server state; Redux is overhead you don't need |
| Calendar | FullCalendar (resource/timeline view) | Booking is the one screen that's genuinely hard to hand-roll well |
| Charts | Recharts | Reports & Analytics screen |
| Backend | Node.js + Express (monolith, **not** Lambda) | ~50 endpoints across 8 workflows is exactly the case where one deploy beats juggling functions, IAM, API Gateway, and cold starts. Lambda is right for HeroPilot's shape (sporadic, event-driven); it's the wrong shape here. |
| ORM | Prisma | Type-safe joins across a genuinely relational schema |
| Database | PostgreSQL (Neon) | The domain is relationship-heavy (departments→employees→assets→allocations→bookings) with real transactional needs (no-double-allocation, no-overlap). Same shape of decision as the schema you built for the Nistula assessment — this just leans on that instinct again. Mongo/DynamoDB were both considered and rejected: this data wants foreign keys and joins, not `populate()` chains or duplicated GSI projections. |
| Auth | JWT (short-lived access + refresh token) + bcrypt | |
| File storage | Cloudinary | Photos on assets, maintenance requests, audit evidence |
| Deploy | Vercel (frontend) + Render (backend) + Neon (DB) | Free tiers, one-click redeploys, reliable for live demo |

```
React + Vite + TS (Vercel)
        │  REST, JWT bearer
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

## 3. Roles & Permission Matrix

| Action | Admin | Asset Manager | Department Head | Employee |
|---|---|---|---|---|
| Signup | — | — | — | Creates Employee account only |
| Promote role (3C) | ✅ only place this happens | ❌ | ❌ | ❌ |
| Org Setup (Dept/Category) | ✅ full CRUD | 👁 view | 👁 view own dept | ❌ |
| Register/Edit Asset | ✅ | ✅ primary owner | ❌ | ❌ |
| View Asset Directory | ✅ org-wide | ✅ org-wide | 👁 own dept + all bookable | 👁 own + all bookable (read-only, incl. seeing who holds a taken asset) |
| Allocate asset (direct) | ✅ | ✅ primary | ❌ | ❌ |
| Request Transfer | ✅ | ✅ | ✅ (on behalf of dept) | ✅ (initiates only) |
| Approve Transfer | ✅ | ✅ | ✅ (within own dept) | ❌ |
| Request Return | ✅ | ✅ | ✅ | ✅ (initiates only) |
| Approve Return + condition notes | ✅ | ✅ primary | ❌ | ❌ |
| Book shared resource | ✅ | ✅ | ✅ (on behalf of dept) | ✅ (self) |
| Raise Maintenance | ✅ | ✅ | ✅ | ✅ (on any visible asset, not just own) |
| Approve/Reject Maintenance | ✅ | ✅ primary | ❌ | ❌ |
| Create Audit Cycle | ✅ only | ❌ | ❌ | ❌ |
| Perform audit checks | if assigned as auditor | if assigned as auditor | if assigned as auditor | if assigned as auditor |
| Close Audit Cycle | ✅ only | ❌ | ❌ | ❌ |
| Reports | Org-wide | Org-wide | Dept-scoped | Personal only |
| Activity Log visibility | Full | Full | Dept-scoped | Own actions only |

Two scope notes worth being deliberate about: **Asset Manager permissions are org-wide** (the PDF never qualifies them with "within their department" the way it does for Department Head) — don't accidentally department-scope an Asset Manager in middleware. **Auditor assignment isn't role-gated** — the spec says "assign one or more auditors" with no restriction, so any employee can be tapped as an auditor for a cycle regardless of their normal role.

---

## 4. Data Model

Types are written in plain language (not Prisma syntax) since this is the spec, not the code — field names use `snake_case` here for readability; when you generate the Prisma schema next, standard convention is PascalCase enum members (e.g. `UnderMaintenance`) with no spaces.

### `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name, email (unique), password_hash | string | |
| role | enum {Admin, AssetManager, DepartmentHead, Employee} | default Employee; Admin is never assignable via UI — bootstrapped once via seed/DB, matching "no self-elevation" |
| department_id | FK → departments, nullable | recommend: employee selects at signup from active departments; Admin can correct later |
| status | enum {Active, Inactive} | |
| created_at, updated_at | timestamp | |

### `departments`
| id PK | name (unique) | parent_department_id (FK → departments, self-ref, nullable) | department_head_id (FK → users, nullable — **must already hold role DepartmentHead**, see §1.4) | status {Active, Inactive} |

*Hierarchy is used for org-chart display and report roll-ups only — permission scoping stays a direct `department_id` match, not hierarchy-aware, to avoid unnecessary complexity.*

### `asset_categories`
| id PK | name (unique) | default_warranty_months (int, nullable) | default_maintenance_cycle_days (int, nullable) | expected_life_months (int, nullable) | custom_fields (JSONB, nullable — for genuinely category-specific attributes beyond the three common ones above, e.g. `registration_expiry` for Vehicles) |

### `assets`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| asset_tag | string, unique | auto-generated `AF-0001` — back with a DB **sequence**, not `SELECT MAX()+1` (race-condition-prone under concurrent registration) |
| name, serial_number, location | string | |
| category_id | FK → asset_categories | |
| acquisition_date | date | |
| acquisition_cost | decimal, nullable | reporting only |
| condition | enum {New, Good, Fair, Poor, Damaged} | |
| department_id | FK → departments, nullable | "home" department |
| current_holder_id | FK → users, nullable | denormalized for fast lookup; `allocations` remains source of truth for history |
| status | enum {Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed} | |
| is_bookable | boolean, default false | |
| photo_url, document_urls | string / string[] | Cloudinary |
| qr_code_value | string, unique | encodes asset_tag or a stable `/assets/{id}` URL |
| created_at, updated_at | timestamp | |

*Indexes: `asset_tag`, `serial_number`, `qr_code_value`, `status`, `category_id`, `department_id` — Screen 4's search/filter list maps directly onto this.*

### `allocations`
| asset_id (FK) | employee_id (FK→users, nullable) | department_id (FK→departments, nullable) — **exactly one of employee_id/department_id set**, enforced via CHECK or app-layer validation | allocated_date | expected_return_date (nullable) | return_requested_at (nullable) | returned_date (nullable) | condition_check_in_notes (text, nullable) | approved_return_by (FK→users, nullable) | status enum {Active, ReturnRequested, Returned, Transferred} |

*Overdue (`expected_return_date < today AND status = Active`) is computed at query time for dashboards — not a stored flag that can go stale.*

### `transfer_requests`
| asset_id | current_allocation_id (FK→allocations) | requested_by (FK→users) | to_employee_id / to_department_id (nullable, one set) | reason (text, nullable) | status {Pending, Approved, Rejected} | approved_by (FK→users, nullable) | resulting_allocation_id (FK→allocations, nullable — filled on approval) | requested_at, resolved_at |

### `bookings`
| asset_id (FK, must be `is_bookable=true`) | booked_by (FK→users) | department_id (FK, nullable — booked on behalf of dept) | start_time, end_time (timestamp) | status {Upcoming, Cancelled} *(persisted — see §6)* | purpose (string, nullable) | reminder_sent_at (timestamp, nullable — idempotency guard for the reminder job) |

*Index: `(asset_id, start_time, end_time)` — this is the overlap-check hot path.*

### `maintenance_requests`
| asset_id | raised_by (FK→users) | issue_description (text) | priority {Low, Medium, High, Critical} | photo_url (nullable) | status {Pending, Approved, Rejected, Assigned, InProgress, Resolved} | approved_by (FK, nullable) | assigned_technician (string — free text unless you want to model technicians as users too) | resolved_at, resolution_notes |

### `audit_cycles`
| name | scope_department_id (FK, nullable) | scope_location (string, nullable) | start_date, end_date | status {Draft, Active, Closed} | created_by (FK→users) | closed_at (nullable) |

### `audit_cycle_auditors` (junction)
| audit_cycle_id | auditor_id (FK→users) |

### `audit_cycle_assets` (junction — **snapshot** of in-scope assets, populated once at creation)
| audit_cycle_id | asset_id |

*Snapshotting the scope at creation time means an asset registered mid-cycle doesn't silently appear on an auditor's list they never agreed to check — the scope is stable for the life of the cycle.*

### `audit_results`
| audit_cycle_id | asset_id | auditor_id (FK→users) | verification_status {Verified, Missing, Damaged} | notes (text, nullable) | checked_at |

### `notifications`
| user_id (FK) | type (enum — mirrors the Module 10 list) | message | related_entity_type, related_entity_id (nullable) | is_read (boolean) | created_at |

### `activity_logs`
| user_id (FK, nullable for system actions) | action (string, e.g. `ASSET_ALLOCATED`) | entity_type, entity_id | metadata (JSONB, nullable) | created_at |

*This table is the single source of truth for both the Activity Log screen (Module 10) **and** the per-asset Timeline on the Asset Detail screen (Module 4) — the Timeline is just this table filtered to one `entity_id`. Don't build two separate history mechanisms.*

---

## 5. Asset Lifecycle State Machine

| From | To | Trigger | Actor |
|---|---|---|---|
| *(new)* | Available | Asset registered | Asset Manager/Admin |
| Available | Allocated | Direct allocation | Asset Manager/Admin |
| Available | Under Maintenance | Maintenance request approved | Asset Manager |
| Available | Retired | Manual retire | Asset Manager/Admin |
| Allocated | Available | Return approved | Asset Manager |
| Allocated | Allocated *(new holder)* | Transfer approved | Asset Manager/Dept Head |
| Allocated | Under Maintenance | Maintenance approved while still allocated — the allocation row stays **open**, only display status changes | Asset Manager |
| Under Maintenance | Available | Resolved, no open allocation | System, automatic |
| Under Maintenance | Allocated | Resolved, allocation still open — reverts to the *same* holder | System, automatic |
| Available / Allocated | Lost | Audit cycle closed with a `Missing` result | System, on cycle close |
| Retired | Disposed | Manual dispose | Asset Manager/Admin |
| Lost | Available | Manual admin correction (audit error) | Admin only — escape hatch, not a normal flow |

**`Reserved` is deliberately not in this table.** A bookable room has many independent time slots — a single stored status can't represent "free 10am–2pm, booked 2–3pm." So `Reserved` is a *display-only, computed* state: shown when a bookable asset currently has a booking with `NOW()` between `start_time` and `end_time`. The real availability calendar always lives in `bookings`.

---

## 6. Module _by-Module Flow

### Module 1 — Login/Signup
Signup → Employee, `status=Active`, no role picker. Login issues short-lived JWT access token + httpOnly refresh cookie; every request re-validates via middleware. Forgot-password → time-limited reset token, emailed (or displayed directly for demo speed if email setup is a time sink). Admin promotion happens later, exclusively via Module 3C.

### Module 2 — Dashboard
One endpoint, role-aware response: Admin/Asset Manager get org-wide KPI cards; Department Head gets the same cards scoped to `department_id`; Employee gets "My Assets / My Bookings / My Requests" instead. Overdue items are a separate, visually distinct query (not just a filter toggle) since the PDF calls this out explicitly as needing separate treatment from upcoming items.

### Module 3 — Organization Setup *(Admin only)*
- **3A Departments:** CRUD + parent (validate no cycles — a department can't be its own ancestor) + `department_head_id` **picker restricted to users already holding the DepartmentHead role.**
- **3B Categories:** CRUD + the common optional fields + `custom_fields` JSON for anything category-specific.
- **3C Employee Directory:** the *only* place role changes happen. Promotion dropdown offers Department Head / Asset Manager only — Admin is not a selectable target.

### Module 4 — Asset Registration & Directory
Register → auto-tag via sequence → Cloudinary upload for photo/docs → QR generated (encodes tag or asset URL). Directory is a searchable/filterable table on the indexed columns above. Asset Detail page = photo, live status, `current_holder`, and a Timeline pulled straight from `activity_logs` — this is your "digital twin" page, and it's core work, not a stretch goal.

### Module 5 — Allocation & Transfer *(the conflict-handling core)*
1. **Allocate** (direct, Asset Manager/Admin): if the asset already has an `Active` allocation → **409**, payload includes current holder + since-date + expected return, so the UI can render exactly the "currently held by Priya" message from the spec and surface a **Request Transfer** button instead of retrying.
2. **Transfer**: requester submits against the current allocation → `Pending` → approved by **either** Asset Manager or the relevant Department Head (see §10.1 — this is one of the things to confirm) → old allocation closes as `Transferred`, new allocation opens `Active`, `current_holder_id` updates, both parties notified.
3. **Return**: employee requests → `ReturnRequested` → Asset Manager approves with condition notes → allocation closes `Returned`, asset flips to `Available`, `current_holder_id` cleared.
4. **Concurrency safety:** a partial unique index guarantees the DB itself will never allow two `Active` allocations on one asset, even under a race:
```sql
CREATE UNIQUE INDEX one_active_allocation_per_asset
ON allocations (asset_id) WHERE status = 'Active';
```
5. **Overdue**: computed for display at any time; a **daily job** (not query-time) is what actually creates the one-time overdue *notification*, since a notification is a discrete event, not a live-computed label.

### Module 6 — Resource Booking *(the overlap-validation core)*
Two ranges overlap iff `new_start < existing_end AND existing_start < new_end` (half-open intervals). This is exactly why the spec's own example works: 9:00–10:00 booked → 9:30–10:30 overlaps (rejected) → 10:00–11:00 does not (`10:00 < 10:00` is false → accepted).

Recommended: back the application-level check with a Postgres exclusion constraint so double-booking is impossible even under simultaneous requests, not just "usually caught":
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  asset_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status <> 'Cancelled');
```
Only `Upcoming`/`Cancelled` are ever *written*; `Ongoing`/`Completed` are computed at read time from `NOW()` vs. `start_time`/`end_time` — no cron job needed to "flip" anything. A separate lightweight job *does* handle slot-start reminders, using `reminder_sent_at` to avoid double-sending.

### Module 7 — Maintenance
Raise (any role, any visible asset) → `Pending` → Asset Manager approves (asset flips to `Under Maintenance`; if it was `Allocated`, the allocation row stays open) or rejects (notify raiser) → Assign Technician → In Progress → Resolved (asset reverts to `Allocated` if that allocation is still open, else `Available`).

### Module 8 — Audit
Admin creates a cycle (scope + date range), assigns auditors, system snapshots the in-scope assets into `audit_cycle_assets`. Auditors mark each `Verified/Missing/Damaged` with notes. Discrepancy report is a live query (Missing + Damaged joined to asset detail), not a stored artifact, until export is requested. **Close Cycle**: locks the cycle; `Missing` → asset becomes `Lost`; `Damaged` → recommend auto-drafting a `Pending` maintenance request for Asset Manager triage (closes the loop instead of leaving it as a dangling flag) — flagged in §10 since it's an addition beyond the literal spec.

### Module 9 — Reports & Analytics
Utilization/idle ranking from allocation+booking date ranges vs. period length; maintenance frequency grouped by asset/category; maintenance/retirement due-dates from category defaults vs. acquisition/last-service dates; department allocation summary; booking heatmap (bookings grouped by hour-of-day × day-of-week); PDF/CSV export.

### Module 10 — Activity Logs & Notifications
Notification types map directly to the PDF's list (Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged). Activity Log screen is `activity_logs` filtered/scoped by role (Admin/Asset Manager: full; Dept Head: department-scoped; Employee: own actions only).

---

## 7. Cross-Cutting: Notification Triggers

| Event | Notified |
|---|---|
| Asset allocated | New holder |
| Transfer requested | Relevant approver(s) |
| Transfer approved/rejected | Requester + both holders |
| Return requested | Asset Manager |
| Return approved | Employee |
| Maintenance raised | Asset Manager |
| Maintenance approved/rejected/resolved | Raiser / current holder |
| Booking confirmed/cancelled | Booker |
| Booking reminder (pre-slot) | Booker |
| Overdue return/booking/maintenance | Holder + Asset Manager (escalation) |
| Audit discrepancy flagged / cycle closed | Admin + Asset Manager |

---

## 8. API Surface (grouped by module)

```
Auth:        POST /auth/signup · /auth/login · /auth/forgot-password · /auth/reset-password
             GET /auth/me · POST /auth/refresh · POST /auth/logout

Departments: GET/POST/PUT /departments · PATCH /departments/:id/status
Categories:  GET/POST/PUT/DELETE /categories
Users:       GET /users · GET /users/:id
             PATCH /users/:id/role · /users/:id/status · /users/:id/department   (admin only)

Assets:      GET /assets (search/filter) · GET /assets/:id · POST /assets · PUT /assets/:id
             GET /assets/:id/history · GET /assets/:id/qr

Allocations: POST /allocations · POST /allocations/:id/return-request
             POST /allocations/:id/approve-return · GET /allocations?asset_id=&employee_id=
             GET /allocations/overdue

Transfers:   POST /transfers · POST /transfers/:id/approve · POST /transfers/:id/reject
             GET /transfers?status=

Bookings:    GET /assets/:id/bookings?range= · POST /bookings
             PATCH /bookings/:id · POST /bookings/:id/cancel · GET /bookings/heatmap

Maintenance: POST /maintenance · POST /maintenance/:id/approve · /reject
             PATCH /maintenance/:id/assign-technician · /resolve
             GET /maintenance?status=&asset_id=

Audit:       POST /audit-cycles · GET /audit-cycles · GET /audit-cycles/:id
             POST /audit-cycles/:id/results · GET /audit-cycles/:id/discrepancy-report
             POST /audit-cycles/:id/close

Dashboard:   GET /dashboard/kpis   (role-aware)
Reports:     GET /reports/utilization · /maintenance-trends · /department-allocation
             GET /reports/booking-heatmap · /upcoming-warranty-retirement · /export

Notifications: GET /notifications · PATCH /notifications/:id/read · /read-all
Activity Logs: GET /activity-logs  (role-scoped)
```

---

## 9. Standout Strategy — Reframed

The PDF makes overdue-flagging, notifications, and a solid asset-detail history *explicit requirements*, not bonuses. So the honest breakdown is:

**Do these well — they're graded, not optional:** conflict handling on allocation (§6.5), overlap validation on booking (§6.6), the full approval chains, and the KPI dashboard. Execution quality here (clean empty states, instant feedback on the 409 conflict, a genuinely nice Asset Detail timeline) *is* your differentiation on the core, even before touching bonus features.

**True optional differentiators (pick one for Day 7, not all ten):**
- **AI Assistant** ("which laptops need maintenance next week?") — implement as **function-calling**, not raw LLM-generated SQL (avoids injection risk entirely, more demo-reliable). Given HeroPilot already uses Gemini + structured JSON extraction, this is largely the same pattern pointed at a new schema — lower net-new risk than it looks.
- **Real-time notifications via Socket.io** — a solid, achievable wow given you've already shipped this exact piece in Fooddel. Lower build risk than the AI assistant, still a genuine "most teams didn't do this" moment.

Everything else on a typical "wow ideas" list (QR, dark mode, PDF export, nice dashboard) is either already core-requirement work (QR) or small enough (~an hour, e.g. Tailwind's `dark:` variant) that it shouldn't consume a dedicated day.

---

## 10. Confirm These Before I Write Code

1. **Transfer approval — single-stage or two-stage?** I've modeled it as: *either* Asset Manager *or* the relevant Department Head can approve, whichever acts first (matches the PDF's literal "Approved by Asset Manager/Department Head"). Your original notes sketched a sequential Dept Head → Asset Manager chain instead. Pick one — it changes the approval endpoint's authorization logic.
2. **Department at signup** — I assumed the employee self-selects from active departments, correctable by Admin later. Confirm, or should it start unassigned until Admin sets it?
3. **Damaged audit items** — I recommended auto-drafting a `Pending` maintenance request on cycle close. That's my addition, not in the literal spec — confirm you want it, or prefer just flagging for manual follow-up.
4. **`Reserved` as computed, not stored** (§4/§5) — confirm this reading of the state, since it's the one state without an explicit example transition in the PDF.
5. **Day-7 differentiator** — AI Assistant, Socket.io real-time notifications, or both if time allows?
6. **Timeline/team size** — I assumed a ~7-day build. Adjust the roadmap in §9 if your actual window differs.

---

## Appendix — 7-Day Roadmap (adjust per §10.6)

| Day | Deliverable |
|---|---|
| 1 | Schema + Auth/RBAC middleware + Org Setup (3A/3B/3C) |
| 2 | Asset Registration & Directory + QR + Cloudinary + Timeline (activity_logs-backed) |
| 3 | Allocation/Transfer/Return + partial-unique-index conflict guard + notifications wiring begins |
| 4 | Resource Booking (FullCalendar) + exclusion-constraint overlap guard + reminder job |
| 5 | Maintenance workflow + Audit Cycle (incl. scope snapshot, discrepancy report, close-cycle side effects) |
| 6 | Dashboard KPIs (role-scoped) + Reports (Recharts) + Activity Log screen |
| 7 | Chosen differentiator + polish (empty/loading states, dark mode) + seed data + deploy + demo rehearsal |