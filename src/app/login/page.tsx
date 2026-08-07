"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { FieldWrapper, Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiPost<{ role: string }>("/api/auth/login", { email, password });
      const dest =
        data.role === "DEPARTMENT_USER"
          ? "/department/dashboard"
          : data.role === "TIMETABLE_ADMIN"
            ? "/admin/consolidated-demand"
            : "/";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white mb-2">
            <GraduationCap size={20} />
          </div>
          <h1 className="text-base font-semibold text-slate-900">KLEF CSAS</h1>
          <p className="text-xs text-slate-500">Course Section Allocation System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldWrapper label="Email" htmlFor="email" required>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </FieldWrapper>
          <FieldWrapper label="Password" htmlFor="password" required error={error}>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(error)}
              required
            />
          </FieldWrapper>
          <Button type="submit" loading={loading} className="w-full justify-center">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
