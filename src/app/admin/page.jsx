"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  ShieldCheck,
  Plus,
  LogOut,
  Search,
  Store,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const STATUS_BADGE = {
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUSPENDED: { label: "Suspended", className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
};

const PLAN_BADGE = {
  TRIAL: { label: "Trial", className: "bg-sky-50 text-sky-700 border-sky-200" },
  BASIC: { label: "Basic", className: "bg-violet-50 text-violet-700 border-violet-200" },
  PRO: { label: "Pro", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/admin/restaurants?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (planFilter) url += `plan=${planFilter}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || []);
        setStats(data.stats || { total: 0, active: 0, trial: 0, suspended: 0 });
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: "Total", value: stats.total, icon: Store, color: "text-foreground", bg: "bg-muted/60" },
    { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Trial", value: stats.trial, icon: Clock, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Suspended", value: stats.suspended, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Platform Admin
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Manage all restaurants from one place
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-9 gap-1.5" asChild>
              <Link href="/admin/restaurants/new">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Restaurant</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await fetch("/api/admin-auth/signout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {/* ─── Stat Cards ─── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold leading-none ${s.color}`}>
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Filters ─── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search restaurants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 border-orange-200/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-orange-200/60 bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 rounded-lg border border-orange-200/60 bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Plans</option>
            <option value="TRIAL">Trial</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
          </select>
        </div>

        {/* ─── Restaurant List ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">Loading restaurants…</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium text-foreground">No restaurants yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first restaurant
            </p>
            <Button className="mt-5 gap-1.5" asChild>
              <Link href="/admin/restaurants/new">
                <Plus className="h-4 w-4" />
                Add Restaurant
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {restaurants.map((r) => {
              const status = STATUS_BADGE[r.status] || STATUS_BADGE.ACTIVE;
              const plan = PLAN_BADGE[r.plan] || PLAN_BADGE.TRIAL;

              return (
                <Link
                  key={r.id}
                  href={`/admin/restaurants/${r.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-orange-200/60 bg-white p-4 transition-all hover:shadow-sm hover:border-orange-300/60"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Store className="h-5 w-5" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {r.name}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${plan.className}`}
                      >
                        {plan.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      /{r.slug} · {r.ownerName} · {r.ownerEmail}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      Created {format(new Date(r.createdAt), "d MMM yyyy")}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
