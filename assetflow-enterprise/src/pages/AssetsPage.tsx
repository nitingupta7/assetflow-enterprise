import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Asset, AssetStatus, Condition } from "../types";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, StatusBadge } from "../components/ui";
import { Table } from "./OrganizationPage";
import { assetService, getCategory, getDepartment, getName } from "../services/domain";
import { categories, departments, activityLogs } from "../data/mockData";
import { downloadCsv, formatDate } from "../lib/utils";

const schema = z.object({ name: z.string().min(2), serialNumber: z.string().min(2), categoryId: z.string(), departmentId: z.string(), location: z.string().min(2), acquisitionDate: z.string(), acquisitionCost: z.coerce.number().min(0), condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]), isBookable: z.boolean().optional() });
type AssetForm = z.infer<typeof schema>;

export const AssetsPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => { assetService.list().then(setAssets); }, []);
  const filtered = useMemo(() => assets.filter((asset) => [asset.tag, asset.name, asset.serialNumber, asset.qrValue].join(" ").toLowerCase().includes(search.toLowerCase())), [assets, search]);
  return (
    <>
      <PageHeader title="Asset Directory" description="Search by tag, serial number, QR code, status, department, or location." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => downloadCsv("assets.csv", [["Tag", "Name"], ...assets.map((asset) => [asset.tag, asset.name])])}><Download size={16} /> Export</Button><Link to="/assets/new"><Button>+ Register Asset</Button></Link></div>} />
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_repeat(4,1fr)_auto]">
          <Input placeholder="Search by asset tag, name, serial number, or QR value" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select><option>Category</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</Select>
          <Select><option>Status</option><option>Available</option><option>Allocated</option><option>Under Maintenance</option></Select>
          <Select><option>Department</option>{departments.map((item) => <option key={item.id}>{item.name}</option>)}</Select>
          <Select><option>Location</option><option>Bengaluru</option><option>HQ Floor 2</option></Select>
          <Button variant="secondary" onClick={() => setSearch("")}>Reset</Button>
        </div>
        {filtered.length ? <Table headers={["Asset Tag", "Name", "Category", "Department", "Status", "Location", "Current Holder", "Updated At", "Actions"]} rows={filtered.map((asset) => [asset.tag, asset.name, getCategory(asset.categoryId), getDepartment(asset.departmentId), <StatusBadge value={asset.status} />, asset.location, getName(asset.holderId), formatDate(asset.updatedAt), <Link key={asset.id} className="font-semibold text-primary" to={`/assets/${asset.id}`}>Open</Link>])} /> : <EmptyState title="No assets found" detail="Reset filters or register a new asset." />}
      </Card>
    </>
  );
};

export const NewAssetPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AssetForm>({ resolver: zodResolver(schema), defaultValues: { categoryId: "cat-elec", departmentId: "dep-eng", condition: "Good", acquisitionDate: "2026-07-12", acquisitionCost: 0 } });
  const submit = handleSubmit(async (values) => {
    const created = await assetService.create({ ...values, isBookable: Boolean(values.isBookable), status: "Available" as AssetStatus, condition: values.condition as Condition, holderId: undefined });
    toast.success(`${created.tag} registered`);
    navigate(`/assets/${created.id}`);
  });
  return (
    <>
      <PageHeader title="Register Asset" description="Asset tags and QR values are generated automatically for the mock service." />
      <form className="grid gap-5 lg:grid-cols-[1fr_320px]" onSubmit={submit}>
        <Card className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Asset name" error={errors.name?.message}><Input {...register("name")} /></Field>
            <Field label="Serial number" error={errors.serialNumber?.message}><Input {...register("serialNumber")} /></Field>
            <Field label="Category"><Select {...register("categoryId")}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Home department"><Select {...register("departmentId")}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Acquisition date"><Input type="date" {...register("acquisitionDate")} /></Field>
            <Field label="Acquisition cost"><Input type="number" {...register("acquisitionCost")} /></Field>
            <Field label="Condition"><Select {...register("condition")}><option>New</option><option>Good</option><option>Fair</option><option>Poor</option><option>Damaged</option></Select></Field>
            <Field label="Location" error={errors.location?.message}><Input {...register("location")} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...register("isBookable")} /> Shared/bookable asset</label>
          <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">Photo upload preview</div><div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">Document upload preview</div></div>
          <Button disabled={isSubmitting}>Register Asset</Button>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Generated Preview</h2>
          <p className="text-sm text-slate-500">Next tag</p>
          <p className="text-2xl font-black">AF-0210</p>
          <div className="mt-5 grid aspect-square place-items-center rounded-2xl border bg-white text-center">
            <QrCode size={112} />
            <span className="sr-only">{watch("name")} QR preview</span>
          </div>
        </Card>
      </form>
    </>
  );
};

export const AssetDetailPage = () => {
  const { id = "" } = useParams();
  const [asset, setAsset] = useState<Asset | undefined>();
  useEffect(() => { assetService.get(id).then(setAsset); }, [id]);
  if (!asset) return <EmptyState title="Asset not found" detail="The requested asset could not be loaded." />;
  const logs = activityLogs.filter((log) => log.entityId === asset.id || log.entityId === "a-0114");
  return (
    <>
      <PageHeader title={`${asset.tag} - ${asset.name}`} description="Digital twin with live status, holder, QR code, and operational history." />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="flex flex-col gap-5 md:flex-row">
            <img className="h-48 w-full rounded-2xl object-cover md:w-64" src={asset.image} alt={asset.name} />
            <div className="flex-1">
              <StatusBadge value={asset.status} />
              <h2 className="mt-3 text-2xl font-black">{asset.name}</h2>
              <p className="text-sm text-slate-500">{getCategory(asset.categoryId)} · {asset.location} · Holder: {getName(asset.holderId)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Edit", "Allocate", "Request Transfer", "Request Return", "Raise Maintenance", "Download QR"].map((label) => <Button key={label} variant="secondary" onClick={() => toast.info(`${label} action opened`)}>{label}</Button>)}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[["Serial number", asset.serialNumber], ["Acquisition date", formatDate(asset.acquisitionDate)], ["Acquisition cost", `INR ${asset.acquisitionCost.toLocaleString("en-IN")}`], ["Condition", asset.condition], ["Department", getDepartment(asset.departmentId)], ["Bookable", asset.isBookable ? "Yes" : "No"]].map(([label, value]) => <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900" key={label}><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">QR Card</h2>
          <div className="grid aspect-square place-items-center rounded-2xl border"><QrCode size={140} /></div>
          <p className="mt-3 break-all text-xs text-slate-500">{asset.qrValue}</p>
        </Card>
      </div>
      <Card className="mt-5">
        <h2 className="mb-4 font-bold">Timeline</h2>
        <ol className="space-y-4">{logs.map((log) => <li key={log.id} className="border-l-2 border-primary pl-4"><p className="font-semibold">{log.description}</p><p className="text-xs text-slate-500">{formatDate(log.timestamp)}</p></li>)}</ol>
      </Card>
    </>
  );
};
