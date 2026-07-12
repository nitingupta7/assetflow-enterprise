import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, ClipboardCheck, Plus, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button, Card, Loading, MetricCard, PageHeader } from "../components/ui";
import { useApp } from "../context/useApp";
import { activityLogs } from "../data/mockData";
import { dashboardService } from "../services/domain";

type MetricTuple = [string, number, string];

export const DashboardPage = () => {
  const { selectedRole } = useApp();
  const [metrics, setMetrics] = useState<MetricTuple[] | null>(null);
  useEffect(() => {
    setMetrics(null);
    dashboardService.get(selectedRole).then((data) => setMetrics(data.metrics as MetricTuple[]));
  }, [selectedRole]);
  const chart = [{ name: "Eng", value: 82 }, { name: "Fac", value: 64 }, { name: "Ops", value: 71 }, { name: "Admin", value: 48 }];

  return (
    <>
      <PageHeader title="Today's Overview" description={selectedRole === "Department Head" ? "Department-scoped asset operations and approvals." : "Live enterprise asset posture, bookings, requests, and alerts."} />
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
        <AlertTriangle size={20} />
        <strong>3 assets are overdue for return and require follow-up.</strong>
      </div>
      {!metrics ? <Loading /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value, path]) => <Link to={path} key={label}><MetricCard label={label} value={value} /></Link>)}</div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_.9fr]">
        <Card>
          <div className="mb-4 flex flex-wrap gap-3">
            <Link to="/assets/new"><Button><Plus size={16} /> Register Asset</Button></Link>
            <Link to="/bookings"><Button variant="secondary"><CalendarClock size={16} /> Book Resource</Button></Link>
            <Link to="/maintenance"><Button variant="secondary"><Wrench size={16} /> Raise Maintenance Request</Button></Link>
          </div>
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          <ol className="space-y-3">
            {activityLogs.slice(0, 4).map((log) => <li className="border-l-2 border-primary pl-3 text-sm text-slate-600 dark:text-slate-300" key={log.id}>{log.description}</li>)}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Utilization</h2>
          <div className="h-56">
            <ResponsiveContainer><BarChart data={chart}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="value" fill="#0F6D46" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-3 font-bold">Upcoming Returns</h2><p className="text-sm text-slate-500">AF-0114 due Jul 09, AF-0021 due Jul 10, AF-0099 due Jul 16.</p></Card>
        <Card><h2 className="mb-3 font-bold">Pending Approvals</h2><p className="flex items-center gap-2 text-sm text-slate-500"><ClipboardCheck size={16} /> 3 transfer approvals and 2 maintenance approvals require review.</p></Card>
      </div>
    </>
  );
};
