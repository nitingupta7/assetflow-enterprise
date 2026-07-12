import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Check, Clock, Download, KanbanSquare, List, Send, Trash2 } from "lucide-react";
import type { AuditCycle, AuditResult, Booking, MaintenanceRequest, TransferRequest } from "../types";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Textarea } from "../components/ui";
import { Table } from "./OrganizationPage";
import { allocationService, auditService, bookingService, getAsset, getName, maintenanceService, notificationService, reportService } from "../services/domain";
import { assets, departments, users } from "../data/mockData";
import { downloadCsv, formatDate } from "../lib/utils";

export const AllocationPage = () => {
  const [tab, setTab] = useState("Direct Allocation");
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [conflict, setConflict] = useState("");
  useEffect(() => { allocationService.data().then((data) => setTransfers(data.transfers)); }, []);
  const submitTransfer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    allocationService.requestTransfer(String(form.get("assetId")), String(form.get("toUserId")), String(form.get("reason"))).then((request) => {
      setTransfers((current) => [request, ...current]);
      toast.success("Transfer request submitted");
    });
  };
  return (
    <>
      <PageHeader title="Allocation & Transfer" description="Direct allocation is blocked for active allocations; transfer requests handle reassignment." />
      <Tabs value={tab} onChange={setTab} items={["Direct Allocation", "Transfer Requests", "Return Requests", "Allocation History", "Overdue"]} />
      {tab === "Direct Allocation" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <Card>
            <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const assetId = String(new FormData(event.currentTarget).get("assetId")); allocationService.allocate(assetId).then((result) => { if (result.ok) toast.success(result.message); else setConflict(`${result.message} Direct re-allocation is blocked. Submit a transfer request instead.`); }); }}>
              <Field label="Asset"><Select name="assetId"><option value="a-0114">AF-0114 - Dell laptop</option><option value="a-0201">AF-0201 - Office chair</option></Select></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Employee or department target"><Select><option>Priya Shah</option><option>Facilities Department</option></Select></Field><Field label="Expected return date"><Input type="date" defaultValue="2026-08-15" /></Field></div>
              <Field label="Notes"><Textarea defaultValue="Temporary assignment for project work" /></Field>
              <Button>Allocate</Button>
            </form>
          </Card>
          {conflict ? <Card className="border-red-200 bg-red-50 text-red-900"><AlertTriangle className="mb-3" /><p className="font-bold">{conflict}</p><dl className="mt-4 grid gap-2 text-sm"><div><dt>Current holder</dt><dd className="font-bold">Priya Shah</dd></div><div><dt>Allocation date</dt><dd>Mar 12</dd></div><div><dt>Expected return</dt><dd>Jul 09</dd></div></dl><Button className="mt-4" onClick={() => setTab("Transfer Requests")}>Request Transfer</Button></Card> : <Card><h2 className="font-bold">Allocation guardrail</h2><p className="mt-2 text-sm text-slate-500">Try allocating AF-0114 to see the double-allocation block in action.</p></Card>}
        </div>
      ) : null}
      {tab === "Transfer Requests" ? (
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <Card><h2 className="mb-4 font-bold">Submit transfer request</h2><form className="grid gap-4" onSubmit={submitTransfer}><Field label="Asset"><Select name="assetId">{assets.filter((asset) => asset.status === "Allocated").map((asset) => <option value={asset.id} key={asset.id}>{asset.tag} - {asset.name}</option>)}</Select></Field><Field label="To"><Select name="toUserId">{users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</Select></Field><Field label="Reason"><Textarea name="reason" required /></Field><Button><Send size={16} /> Submit request</Button></form></Card>
          <Card><Table headers={["Asset", "From", "To", "Requested by", "Status", "Actions"]} rows={transfers.map((item) => [getAsset(item.assetId)?.tag ?? item.assetId, getName(item.fromUserId), getName(item.toUserId), getName(item.requestedById), <StatusBadge value={item.status} />, item.status === "Pending" ? <Button key={item.id} variant="secondary" onClick={() => allocationService.approveTransfer(item.id).then(() => { toast.success("Transfer approved"); allocationService.data().then((data) => setTransfers(data.transfers)); })}><Check size={16} /> Approve</Button> : "Closed"])} /></Card>
        </div>
      ) : null}
      {tab === "Return Requests" ? <Card><Table headers={["Asset", "Holder", "Requested date", "Condition notes", "Action"]} rows={[["AF-0021", "Priya Shah", "Jul 12", "Screen cracked", <Button key="approve" onClick={() => toast.success("Return approved with condition notes")}>Approve Return</Button>]]} /></Card> : null}
      {tab === "Allocation History" ? <Card><ol className="space-y-3 text-sm"><li>Mar 12 - Allocated to Priya Shah - Engineering</li><li>Jan 04 - Returned by Arjun Nair - condition good</li></ol></Card> : null}
      {tab === "Overdue" ? <Card className="border-red-200"><Table headers={["Asset", "Holder", "Due", "Days overdue"]} rows={[["AF-0021", "Priya Shah", "Jul 09", "3"], ["AF-0114", "Priya Shah", "Jul 09", "3"]]} /></Card> : null}
    </>
  );
};

export const BookingPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conflict, setConflict] = useState("");
  useEffect(() => { bookingService.list().then(setBookings); }, []);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    bookingService.create({ assetId: String(form.get("assetId")), bookedById: "u-priya", departmentId: String(form.get("departmentId")) || undefined, date: String(form.get("date")), start: String(form.get("start")), end: String(form.get("end")), purpose: String(form.get("purpose")) }).then((result) => {
      if (result.ok) { toast.success("Booking confirmed"); setConflict(""); bookingService.list().then(setBookings); } else setConflict(result.message ?? "This time overlaps with an existing booking. Select another slot.");
    });
  };
  return (
    <>
      <PageHeader title="Resource Booking" description="Bookable resources are assets with the shared/bookable flag." />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-3"><Select><option>Conference Room B2 - Tue, 12 Jul</option></Select><Input type="date" defaultValue="2026-07-12" /><Select><option>Day view</option><option>Week view</option></Select></div>
          <div className="space-y-3">
            {["09:00", "10:00", "11:00", "12:00", "13:00"].map((time) => <div key={time} className="grid grid-cols-[70px_1fr] items-center gap-4"><span className="font-semibold text-slate-500">{time}</span><div className="h-16 rounded-2xl border border-slate-200 bg-slate-50 p-3">{time === "09:00" ? <div className="h-full rounded-xl bg-blue-100 px-4 py-2 font-semibold text-blue-800">Booked - Procurement Team - 9 to 10</div> : null}{time === "10:00" && conflict ? <div className="h-full rounded-xl border-2 border-dashed border-red-300 px-4 py-2 font-semibold text-red-700">{conflict}</div> : null}</div></div>)}
          </div>
        </Card>
        <Card><h2 className="mb-4 font-bold">New booking</h2><form className="grid gap-4" onSubmit={submit}><Field label="Resource"><Select name="assetId"><option value="a-room">Conference Room B2</option><option value="a-0062">Projector</option></Select></Field><Field label="Date"><Input name="date" type="date" defaultValue="2026-07-12" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Start"><Input name="start" type="time" defaultValue="09:30" /></Field><Field label="End"><Input name="end" type="time" defaultValue="10:30" /></Field></div><Field label="Purpose"><Input name="purpose" defaultValue="Planning session" /></Field><label className="flex gap-2 text-sm"><input type="checkbox" /> Book on behalf of department</label><Field label="Department"><Select name="departmentId">{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</Select></Field><Button>Book slot</Button></form></Card>
      </div>
      <Card className="mt-5"><h2 className="mb-4 font-bold">My bookings</h2><Table headers={["Resource", "Date", "Time", "Purpose", "State", "Action"]} rows={bookings.map((booking) => [getAsset(booking.assetId)?.name ?? booking.assetId, booking.date, `${booking.start}-${booking.end}`, booking.purpose, booking.status, <Button key={booking.id} variant="secondary" onClick={() => bookingService.cancel(booking.id).then(() => { toast.success("Booking cancelled"); bookingService.list().then(setBookings); })}>Cancel</Button>])} /></Card>
    </>
  );
};

export const MaintenancePage = () => {
  const [view, setView] = useState<"board" | "table">("board");
  const [items, setItems] = useState<MaintenanceRequest[]>([]);
  useEffect(() => { maintenanceService.list().then(setItems); }, []);
  const statuses: MaintenanceRequest["status"][] = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"];
  const move = (id: string, status: MaintenanceRequest["status"]) => maintenanceService.move(id, status).then(() => { toast.success(`Moved to ${status}`); maintenanceService.list().then(setItems); });
  return (
    <>
      <PageHeader title="Maintenance Management" description="Approval workflow as a Kanban board with table fallback." action={<div className="flex gap-2"><Button variant={view === "board" ? "primary" : "secondary"} onClick={() => setView("board")}><KanbanSquare size={16} /> Board</Button><Button variant={view === "table" ? "primary" : "secondary"} onClick={() => setView("table")}><List size={16} /> Table</Button></div>} />
      {view === "board" ? (
        <div className="grid gap-4 xl:grid-cols-5">
          {statuses.map((status) => (
            <Card key={status} className="min-h-96">
              <h2 className="mb-4 font-bold">{status}</h2>
              <div className="space-y-3">
                {items.filter((item) => item.status === status).map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" key={item.id}>
                    <p className="font-bold">{getAsset(item.assetId)?.tag ?? item.assetId}</p>
                    <p className="text-sm">{item.issue}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.priority} - Raised by {getName(item.raisedById)} {item.technician ? `- ${item.technician}` : ""}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== "Resolved" ? <Button variant="secondary" onClick={() => move(item.id, statuses[Math.min(statuses.indexOf(status) + 1, statuses.length - 1)])}>Advance</Button> : null}
                      <Button variant="ghost" onClick={() => toast.info("Maintenance detail opened")}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table
            headers={["Asset", "Issue", "Priority", "Raised by", "Status", "Action"]}
            rows={items.map((item) => [
              getAsset(item.assetId)?.tag ?? item.assetId,
              item.issue,
              item.priority,
              getName(item.raisedById),
              <StatusBadge key={`${item.id}-status`} value={item.status === "Technician Assigned" ? "Approved" : item.status} />,
              <Button key={item.id} onClick={() => move(item.id, "Resolved")}>Resolve</Button>,
            ])}
          />
        </Card>
      )}
    </>
  );
};

export const AuditListPage = () => {
  const [data, setData] = useState<{ audits: AuditCycle[]; results: AuditResult[] } | null>(null);
  useEffect(() => { auditService.list().then(setData); }, []);
  return (
    <>
      <PageHeader title="Asset Audit" description="Create cycles, assign auditors, verify checklist items, and close discrepancy reports." action={<Button onClick={() => toast.success("Audit creation dialog opened")}>Create Audit</Button>} />
      <div className="mb-4 flex gap-3"><Select className="max-w-48"><option>Status filter</option><option>Active</option><option>Closed</option></Select><Select className="max-w-48"><option>Department filter</option>{departments.map((item) => <option key={item.id}>{item.name}</option>)}</Select></div>
      <div className="grid gap-4 md:grid-cols-2">{data?.audits.map((audit) => <Link to={`/audits/${audit.id}`} key={audit.id}><Card><StatusBadge value={audit.status === "Active" ? "Active" : "Inactive"} /><h2 className="mt-3 text-lg font-bold">{audit.name}</h2><p className="text-sm text-slate-500">{formatDate(audit.startDate)} - {formatDate(audit.endDate)} · {audit.auditorIds.map(getName).join(", ")}</p></Card></Link>)}</div>
    </>
  );
};

export const AuditDetailPage = () => {
  const { id = "au-1" } = useParams();
  const [data, setData] = useState<{ audits: AuditCycle[]; results: AuditResult[] } | null>(null);
  useEffect(() => { auditService.list().then(setData); }, []);
  const audit = data?.audits.find((item) => item.id === id);
  const results = data?.results.filter((item) => item.auditId === id) ?? [];
  if (!audit) return <EmptyState title="Audit not found" detail="The requested audit cycle is unavailable." />;
  return (
    <>
      <PageHeader title={audit.name} description={`${formatDate(audit.startDate)} to ${formatDate(audit.endDate)} · Auditors: ${audit.auditorIds.map(getName).join(", ")}`} action={<Button onClick={() => toast.success("Audit cycle closed")}>Close audit cycle</Button>} />
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">2 assets flagged. A discrepancy report has been generated.</div>
      <Card><Table headers={["Asset", "Expected location", "Auditor", "Verification", "Notes", "Checked at", "Action"]} rows={results.map((result) => [getAsset(result.assetId)?.tag ?? result.assetId, result.expectedLocation, getName(result.auditorId), <StatusBadge value={result.verification} />, result.notes, result.checkedAt ?? "--", <Select key={result.id} value={result.verification} onChange={(event) => auditService.updateResult(result.id, event.target.value as AuditResult["verification"]).then(() => { toast.success("Verification saved"); auditService.list().then(setData); })}><option>Verified</option><option>Missing</option><option>Damaged</option><option>Pending</option></Select>])} /></Card>
    </>
  );
};

export const ReportsPage = () => {
  const [data, setData] = useState<{ utilization: Array<{ name: string; value: number }>; maintenance: Array<{ month: string; count: number }>; distribution: Array<{ name: string; value: number }> } | null>(null);
  useEffect(() => { reportService.data().then(setData); }, []);
  const colors = ["#0F6D46", "#2563EB", "#F59E0B"];
  return (
    <>
      <PageHeader title="Reports & Analytics" description="Utilization, maintenance frequency, booking heatmap, idle assets, and due-for-service lists." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => toast.info("PDF export demo queued")}><Download size={16} /> PDF</Button><Button onClick={() => downloadCsv("assetflow-report.csv", [["Metric", "Value"], ["Room B2 bookings", "34"]])}>CSV</Button></div>} />
      <Card className="mb-5"><div className="grid gap-3 md:grid-cols-4"><Input type="date" defaultValue="2026-07-01" /><Input type="date" defaultValue="2026-07-31" /><Select><option>All departments</option></Select><Select><option>All categories</option></Select></div></Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Utilization by department">{data ? <ResponsiveContainer><BarChart data={data.utilization}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0F6D46" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : null}</ChartCard>
        <ChartCard title="Maintenance frequency">{data ? <ResponsiveContainer><LineChart data={data.maintenance}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#DC2626" strokeWidth={3} /></LineChart></ResponsiveContainer> : null}</ChartCard>
        <ChartCard title="Allocation distribution">{data ? <ResponsiveContainer><PieChart><Pie data={data.distribution} dataKey="value" nameKey="name" outerRadius={92}>{data.distribution.map((_, index) => <Cell key={index} fill={colors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : null}</ChartCard>
        <Card><h2 className="mb-4 font-bold">Booking heatmap</h2><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, index) => <div key={index} className="h-10 rounded-lg" style={{ backgroundColor: `rgba(15,109,70,${0.12 + (index % 5) * 0.15})` }} />)}</div></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3"><Card><h2 className="font-bold">Most-used assets</h2><p className="mt-3 text-sm text-slate-500">Room B2 - 34 bookings this month<br />Van AF-343 - 21 trips this month<br />Projector AF-335 - 18 uses</p></Card><Card><h2 className="font-bold">Idle assets</h2><p className="mt-3 text-sm text-slate-500">Camera AF-0301 - unused for 60+ days<br />Chair AF-0410 - unused for 45 days</p></Card><Card><h2 className="font-bold">Maintenance and retirement</h2><p className="mt-3 text-sm text-slate-500">Forklift AF-0087 - service due in 5 days<br />Laptop AF-0020 - four years old, nearing retirement</p></Card></div>
    </>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => <Card><h2 className="mb-4 font-bold">{title}</h2><div className="h-72">{children}</div></Card>;

export const NotificationsPage = () => {
  const [tab, setTab] = useState("All");
  const [data, setData] = useState<{ notifications: Awaited<ReturnType<typeof notificationService.list>>["notifications"]; logs: Awaited<ReturnType<typeof notificationService.list>>["logs"] } | null>(null);
  useEffect(() => { notificationService.list().then(setData); }, []);
  const visible = useMemo(() => (data?.notifications ?? []).filter((item) => tab === "All" || item.type === tab.slice(0, -1) || item.type === tab), [data, tab]);
  return (
    <>
      <PageHeader title="Notifications" description="Activity logs and notifications are role-scoped from one audit trail." action={<Button onClick={() => notificationService.markAll().then(() => { toast.success("All marked read"); notificationService.list().then(setData); })}>Mark all as read</Button>} />
      <Tabs value={tab} onChange={setTab} items={["All", "Alerts", "Approvals", "Bookings"]} />
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((item) => (
            <div key={item.id} className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${item.read ? "" : "bg-emerald-50/60 px-3"}`}>
              <div>
                <p className="font-semibold">{item.message}</p>
                <p className="text-xs text-slate-500">{item.type} - {item.timestamp}</p>
              </div>
              <div className="flex gap-2">
                <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-emerald-50" to={item.entityPath}>Open</Link>
                <Button variant="secondary" onClick={() => notificationService.markRead(item.id).then(() => { toast.success("Marked as read"); notificationService.list().then(setData); })}>Read</Button>
                <Button variant="ghost" onClick={() => toast.success("Notification deleted")}><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-5"><h2 className="mb-3 font-bold">Activity Log</h2><ol className="space-y-3">{data?.logs.map((log) => <li key={log.id} className="flex gap-3 text-sm"><Clock size={16} className="mt-0.5 text-slate-400" /><span>{log.description}</span></li>)}</ol></Card>
    </>
  );
};

export const ProfilePage = () => <><PageHeader title="Profile" description="Personal details, department, and role preview." /><Card><p className="text-sm text-slate-600">Demo profile settings are stored in localStorage for this frontend prototype.</p></Card></>;
export const SettingsPage = () => <><PageHeader title="Settings" description="Workspace preferences and API integration settings." /><Card><p className="text-sm text-slate-600">Theme preference, selected role, and demo auth are persisted locally.</p></Card></>;
export const NotFoundPage = () => <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6"><Card className="max-w-lg text-center"><h1 className="text-4xl font-black">404</h1><p className="mt-2 text-slate-500">This AssetFlow route does not exist.</p><Link to="/dashboard"><Button className="mt-5">Back to dashboard</Button></Link></Card></main>;

const Tabs = ({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) => <div className="mb-5 flex gap-2 overflow-x-auto">{items.map((item) => <Button key={item} variant={value === item ? "primary" : "secondary"} onClick={() => onChange(item)}>{item}</Button>)}</div>;
