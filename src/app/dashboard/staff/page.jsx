"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  Loader2,
  UserPlus,
  Settings,
  Copy,
  CheckCircle2,
  ChefHat,
  ConciergeBell,
  Truck,
  ShieldCheck,
  Clock,
  Briefcase,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

const DEPT_CONFIG = {
  KITCHEN: { label: "Kitchen", icon: ChefHat, color: "bg-red-50 text-red-700 border-red-200" },
  FRONT: { label: "Front", icon: ConciergeBell, color: "bg-sky-50 text-sky-700 border-sky-200" },
  DELIVERY: { label: "Delivery", icon: Truck, color: "bg-violet-50 text-violet-700 border-violet-200" },
  MANAGER: { label: "Manager", icon: ShieldCheck, color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const ROLE_CONFIG = {
  OWNER: { label: "Owner", color: "bg-amber-50 text-amber-700 border-amber-200" },
  MANAGER: { label: "Manager", color: "bg-sky-50 text-sky-700 border-sky-200" },
  STAFF: { label: "Staff", color: "bg-muted text-muted-foreground border-border" },
};

const CONTRACT_CONFIG = {
  FULL_TIME: { label: "Full-time", hours: 150 },
  PART_TIME: { label: "Part-time", hours: 80 },
  MINI_JOB: { label: "Mini-Job", hours: 40 },
};

export default function StaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Add form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    role: "STAFF", department: "FRONT",
    contractType: "PART_TIME", monthlyHoursTarget: 80,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error("Fetch staff failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff");
      setCredentials(data);
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!credentials) return;
    const text = `Email: ${credentials.staff.email}\nPassword: ${credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Toggle active failed:", err);
    }
  };

  const slug = session?.user?.restaurantSlug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">Staff</h1>
              <p className="text-xs text-muted-foreground">{staff.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 gap-1.5" asChild>
              <Link href="/dashboard/staff/settings">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Shift Config</span>
              </Link>
            </Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => { setAddDialogOpen(true); setCredentials(null); setError(""); }}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Staff</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-orange-200/60 pl-9"
          />
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">Loading staff…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <p className="mt-4 font-medium text-foreground">No staff members yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your team to get started with shift planning</p>
            <Button className="mt-5 gap-1.5" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />Add Staff Member
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const dept = DEPT_CONFIG[s.department] || DEPT_CONFIG.FRONT;
              const role = ROLE_CONFIG[s.role] || ROLE_CONFIG.STAFF;
              const contract = CONTRACT_CONFIG[s.contractType] || CONTRACT_CONFIG.PART_TIME;
              const DeptIcon = dept.icon;
              const hoursPercent = s.monthlyHoursTarget > 0 ? Math.round((s.hoursThisMonth / s.monthlyHoursTarget) * 100) : 0;

              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:shadow-sm ${
                    s.isActive ? "border-orange-200/60" : "border-border opacity-60"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.isActive ? "bg-orange-100" : "bg-muted"}`}>
                    <DeptIcon className={`h-5 w-5 ${s.isActive ? "text-orange-600" : "text-muted-foreground"}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">{s.name}</h3>
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${dept.color}`}>
                        {dept.label}
                      </span>
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${role.color}`}>
                        {role.label}
                      </span>
                      {!s.isActive && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />{contract.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{s.hoursThisMonth}h / {s.monthlyHoursTarget}h ({hoursPercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {s.availabilityToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Copy availability link"
                        onClick={() => {
                          navigator.clipboard.writeText(`${baseUrl}/staff-availability/${s.availabilityToken}?slug=${slug}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleToggleActive(s.id, s.isActive)}
                    >
                      {s.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md border-orange-200/60">
          <DialogHeader>
            <DialogTitle>{credentials ? "Staff Member Created" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {credentials
                ? "Share these credentials with the new team member."
                : "Add a new team member to your restaurant."}
            </DialogDescription>
          </DialogHeader>

          {credentials ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">{credentials.staff.name} added as {credentials.staff.role}</p>
              </div>
              <div className="rounded-lg border border-orange-200/60 bg-orange-50/30 p-4 font-mono text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{credentials.staff.email}</span></div>
                <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Password</span><span>{credentials.temporaryPassword}</span></div>
              </div>
              <Button variant="outline" className="w-full gap-1.5" onClick={handleCopy}>
                {copied ? <><CheckCircle2 className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Credentials</>}
              </Button>
              <Button className="w-full" onClick={() => setAddDialogOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="mb-1.5 text-sm font-medium">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="border-orange-200/60" />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 text-sm font-medium">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="border-orange-200/60" />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 text-sm font-medium">Phone (optional)</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-orange-200/60" />
                </div>
                <div>
                  <Label className="mb-1.5 text-sm font-medium">Department</Label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="h-10 w-full rounded-lg border border-orange-200/60 bg-white px-3 text-sm"
                  >
                    <option value="KITCHEN">Kitchen</option>
                    <option value="FRONT">Front (Serving)</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-sm font-medium">Role</Label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="h-10 w-full rounded-lg border border-orange-200/60 bg-white px-3 text-sm"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-sm font-medium">Contract</Label>
                  <select
                    value={form.contractType}
                    onChange={(e) => {
                      const ct = e.target.value;
                      const hours = ct === "FULL_TIME" ? 150 : ct === "PART_TIME" ? 80 : 40;
                      setForm({ ...form, contractType: ct, monthlyHoursTarget: hours });
                    }}
                    className="h-10 w-full rounded-lg border border-orange-200/60 bg-white px-3 text-sm"
                  >
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="MINI_JOB">Mini-Job</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 text-sm font-medium">Hours/month</Label>
                  <Input
                    type="number"
                    value={form.monthlyHoursTarget}
                    onChange={(e) => setForm({ ...form, monthlyHoursTarget: parseInt(e.target.value) || 80 })}
                    className="border-orange-200/60"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <Button type="submit" disabled={submitting} className="h-12 w-full text-base font-semibold shadow-md shadow-primary/20">
                {submitting ? "Adding…" : "Add Staff Member"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
