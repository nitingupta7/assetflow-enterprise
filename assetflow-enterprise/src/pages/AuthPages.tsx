import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useApp } from "../context/useApp";
import { departments } from "../data/mockData";
import { Button, Card, Field, Input, Select } from "../components/ui";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6), remember: z.boolean().optional() });
type LoginValues = z.infer<typeof loginSchema>;
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), departmentId: z.string().min(1), password: z.string().min(6), confirm: z.string().min(6), terms: z.literal(true) }).refine((value) => value.password === value.confirm, { path: ["confirm"], message: "Passwords must match" });
type SignupValues = z.infer<typeof signupSchema>;

const AuthFrame = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dff7eb,transparent_34%),#F7F8FA] p-4 dark:bg-slate-950">
    <Card className="w-full max-w-xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-primary text-2xl font-black text-white">AF</div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </Card>
  </main>
);

export const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "admin@assetflow.test", password: "password" } });
  const submit = handleSubmit(async (values) => {
    await login(values.email, values.password);
    toast.success("Welcome to AssetFlow");
    navigate("/dashboard");
  });
  return (
    <AuthFrame title="AssetFlow - login" subtitle="Manage assets, bookings, maintenance, audits, and approvals from one workspace.">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" error={errors.email?.message}><Input {...register("email")} /></Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Input type={show ? "text" : "password"} {...register("password")} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShow((value) => !value)} aria-label="Toggle password visibility">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" {...register("remember")} /> Remember me</label>
          <Link className="font-semibold text-primary" to="/forgot-password">Forgot password?</Link>
        </div>
        <Button className="w-full" disabled={isSubmitting}>Login</Button>
      </form>
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">Signing up creates an employee account. Administrative roles are assigned later.</div>
      <p className="mt-5 text-center text-sm text-slate-500">New here? <Link className="font-bold text-primary" to="/signup">Create Account</Link></p>
    </AuthFrame>
  );
};

export const SignupPage = () => {
  const { signup } = useApp();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { departmentId: "dep-eng" } });
  const submit = handleSubmit(async (values) => {
    await signup(values.name, values.email, values.departmentId);
    toast.success("Employee account created");
    navigate("/dashboard");
  });
  return (
    <AuthFrame title="Create employee account" subtitle="Role elevation is handled only by an Admin in the Employee Directory.">
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Full name" error={errors.name?.message}><Input {...register("name")} /></Field>
        <Field label="Work email" error={errors.email?.message}><Input {...register("email")} /></Field>
        <Field label="Department" error={errors.departmentId?.message}><Select {...register("departmentId")}>{departments.filter((item) => item.status === "Active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password?.message}><Input type="password" {...register("password")} /></Field>
          <Field label="Confirm password" error={errors.confirm?.message}><Input type="password" {...register("confirm")} /></Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" {...register("terms")} /> I agree to follow company asset policies.</label>
        {errors.terms ? <p className="text-xs font-semibold text-red-600">Terms must be accepted</p> : null}
        <Button disabled={isSubmitting}>Create Account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">Already have access? <Link className="font-bold text-primary" to="/login">Login</Link></p>
    </AuthFrame>
  );
};

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame title="Reset password" subtitle="Enter your work email and we will send reset instructions.">
      {sent ? <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800">Reset link sent. Check your inbox for the demo recovery email.</div> : (
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setSent(true); toast.success("Reset link sent"); }}>
          <Field label="Work email"><Input type="email" required placeholder="name@company.com" /></Field>
          <Button className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link className="font-bold text-primary" to="/login">Back to login</Link></p>
    </AuthFrame>
  );
};
