import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AssetCategory, Department, Role, User } from "../types";
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge } from "../components/ui";
import { getDepartment, getName, organizationService } from "../services/domain";

export const OrganizationPage = () => {
  const [tab, setTab] = useState<"Departments" | "Categories" | "Employees">("Departments");
  const [data, setData] = useState<{ users: User[]; departments: Department[]; categories: AssetCategory[] } | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => { organizationService.list().then(setData); }, []);
  const filteredDepartments = useMemo(() => (data?.departments ?? []).filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const departmentHeads = (data?.users ?? []).filter((user) => user.role === "Department Head");

  const addDepartment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    organizationService.addDepartment({ name: String(form.get("name")), headId: String(form.get("headId")), parentId: String(form.get("parentId")) || undefined, status: String(form.get("status")) as Department["status"] }).then(() => {
      toast.success("Department added");
      setOpen(false);
      organizationService.list().then(setData);
    });
  };

  const changeRole = (id: string, role: Role) => {
    organizationService.changeRole(id, role).then(() => {
      toast.success("Employee role updated");
      organizationService.list().then(setData);
    });
  };

  return (
    <>
      <PageHeader title="Organization Setup" description="Admin-only setup for departments, categories, and employee role promotion." action={<Button onClick={() => setOpen(true)}>+ Add</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["Departments", "Categories", "Employees"] as const).map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}
      </div>
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select className="sm:w-48"><option>All statuses</option><option>Active</option><option>Inactive</option></Select>
        </div>
        {!data ? <EmptyState title="Loading setup data" detail="Fetching mock organization records." /> : null}
        {tab === "Departments" && data ? (
          filteredDepartments.length ? <Table headers={["Department", "Head", "Parent Dept", "Status", "Actions"]} rows={filteredDepartments.map((item) => [item.name, getName(item.headId), getDepartment(item.parentId), <StatusBadge value={item.status} />, <Button key="toggle" variant="secondary" onClick={() => organizationService.updateDepartment(item.id, { status: item.status === "Active" ? "Inactive" : "Active" }).then(() => { toast.success("Status updated"); organizationService.list().then(setData); })}>Toggle</Button>])} /> : <EmptyState title="No departments found" detail="Try another search or add a department." />
        ) : null}
        {tab === "Categories" && data ? <Table headers={["Category", "Warranty", "Maintenance cycle", "Expected life", "Status"]} rows={data.categories.map((item) => [item.name, `${item.warrantyMonths} months`, `${item.maintenanceCycleDays} days`, `${item.expectedLifeMonths} months`, <StatusBadge value={item.status} />])} /> : null}
        {tab === "Employees" && data ? <Table headers={["Avatar", "Name", "Email", "Department", "Role", "Status", "Actions"]} rows={data.users.map((item) => [<span key={item.id} className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold">{item.avatar}</span>, item.name, item.email, getDepartment(item.departmentId), item.role, <StatusBadge value={item.status} />, <Select key="role" value={item.role} onChange={(event) => changeRole(item.id, event.target.value as Role)}><option>Employee</option><option>Department Head</option><option>Asset Manager</option></Select>])} /> : null}
      </Card>
      <Modal open={open} title="Add department" onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={addDepartment}>
          <Field label="Department name"><Input name="name" required /></Field>
          <Field label="Parent department"><Select name="parentId"><option value="">No parent</option>{data?.departments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Department head"><Select name="headId">{departmentHeads.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Status"><Select name="status"><option>Active</option><option>Inactive</option></Select></Field>
          <Button>Save department</Button>
        </form>
      </Modal>
    </>
  );
};

export const Table = ({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">{headers.map((header) => <th className="px-3 py-3" key={header}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800" key={index}>{row.map((cell, cellIndex) => <td className="px-3 py-3 align-middle" key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);
