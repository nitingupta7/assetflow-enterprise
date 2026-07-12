import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { statusTone } from "../services/domain";

export const Button = ({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) => (
  <button
    className={cn(
      "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" && "bg-primary text-white shadow-sm hover:bg-primary-hover",
      variant === "secondary" && "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      variant === "ghost" && "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
      className,
    )}
    {...props}
  />
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white", className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white", className)} {...props}>{children}</select>
));
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950", className)}>{children}</section>
);

export const PageHeader = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
        AssetFlow <ChevronRight size={14} /> <span>{title}</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
      {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {action}
  </div>
);

export const StatusBadge = ({ value }: { value: string }) => (
  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusTone[value as keyof typeof statusTone] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>{value}</span>
);

export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
    <span>{label}</span>
    {children}
    {error ? <span className="block text-xs font-medium text-red-600">{error}</span> : null}
  </label>
);

export const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
    <AlertCircle className="mx-auto mb-3 text-slate-400" />
    <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{detail}</p>
  </div>
);

export const Skeleton = () => <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;

export const Loading = () => <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading</div>;

export const MetricCard = ({ label, value, children }: { label: string; value: number; children?: ReactNode }) => (
  <Card className="p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    {children}
  </Card>
);

export const Modal = ({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[18px] bg-white p-6 shadow-2xl dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
};
