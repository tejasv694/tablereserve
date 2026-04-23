"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, CalendarDays,
  RefreshCw, Send, AlertTriangle, CheckCircle2,
  ChefHat, ConciergeBell, Truck, ShieldCheck, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEPT_ICON = {
  KITCHEN: ChefHat,
  FRONT: ConciergeBell,
  DELIVERY: Truck,
  MANAGER: ShieldCheck,
};

const DEPT_COLOR = {
  KITCHEN: "bg-red-50 text-red-700 border-red-200",
  FRONT: "bg-sky-50 text-sky-700 border-sky-200",
  DELIVERY: "bg-violet-50 text-violet-700 border-violet-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-muted text-muted-foreground" },
  SHORTAGE: { label: "Shortage", color: "bg-red-50 text-red-700 border-red-200" },
  RELEASED: { label: "Released", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERRIDDEN: { label: "Modified", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function ShiftsPage() {
  const { data: session } = useSession();
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    ws.setHours(0, 0, 0, 0);
    return ws;
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts?week=${weekStart.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (err) {
      console.error("Fetch plan failed:", err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: weekStart.toISOString() }),
      });
      if (res.ok) {
        fetchPlan();
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRelease = async () => {
    if (!plan) return;
    setReleasing(true);
    try {
      const res = await fetch(`/api/shifts/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });
      if (res.ok) {
        fetchPlan();
      }
    } catch (err) {
      console.error("Release failed:", err);
    } finally {
      setReleasing(false);
    }
  };

  // Group assignments by day index
  const assignmentsByDay = {};
  if (plan?.assignments) {
    for (const a of plan.assignments) {
      const d = new Date(a.date);
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
      if (!assignmentsByDay[dayIdx]) assignmentsByDay[dayIdx] = [];
      assignmentsByDay[dayIdx].push(a);
    }
  }

  const shortages = plan?.shortageDetails
    ? (typeof plan.shortageDetails === "string" ? JSON.parse(plan.shortageDetails) : plan.shortageDetails)
    : [];

  const statusCfg = plan ? STATUS_CONFIG[plan.status] || STATUS_CONFIG.DRAFT : null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">Shift Plan</h1>
              <p className="text-xs text-muted-foreground">
                {format(weekStart, "d MMM")} — {format(addDays(weekStart, 6), "d MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plan && statusCfg && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            )}
            <Button
              variant="outline" size="sm" className="h-9 gap-1.5"
              onClick={handleGenerate} disabled={generating}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">{plan ? "Regenerate" : "Generate"}</span>
            </Button>
            {plan && plan.status !== "RELEASED" && (
              <Button size="sm" className="h-9 gap-1.5" onClick={handleRelease} disabled={releasing}>
                {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Release</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-4 px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => {
            const now = startOfWeek(new Date(), { weekStartsOn: 1 });
            now.setHours(0, 0, 0, 0);
            setWeekStart(now);
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          This Week
        </button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 sm:px-6">
        {/* Shortage Alert */}
        {shortages.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">Staff Shortage Detected</p>
              <ul className="mt-1 space-y-0.5 text-sm text-red-700">
                {shortages.map((s, i) => (
                  <li key={i}>{s.day}: {s.role} — need {s.needed}, have {s.assigned} (short {s.deficit})</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">Loading shift plan…</p>
          </div>
        ) : !plan ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <CalendarDays className="h-6 w-6 text-orange-600" />
            </div>
            <p className="mt-4 font-medium text-foreground">No shift plan for this week</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate a plan based on staff availability</p>
            <Button className="mt-5 gap-1.5" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Generate Plan
            </Button>
          </div>
        ) : (
          /* Weekly Grid */
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((dayLabel, dayIdx) => {
              const date = addDays(weekStart, dayIdx);
              const dayAssignments = assignmentsByDay[dayIdx] || [];
              const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={dayIdx}
                  className={`rounded-xl border p-3 ${
                    isToday ? "border-primary bg-primary/5" : "border-orange-200/60 bg-white"
                  }`}
                >
                  <div className="mb-2 text-center">
                    <p className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {dayLabel}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                      {format(date, "d")}
                    </p>
                  </div>

                  {dayAssignments.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-muted-foreground">No shifts</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayAssignments.map((a) => {
                        const Icon = DEPT_ICON[a.role] || Users;
                        const color = DEPT_COLOR[a.role] || DEPT_COLOR.FRONT;
                        return (
                          <div
                            key={a.id}
                            className={`rounded-lg border p-2 text-[11px] ${
                              a.status === "CANCELLED" ? "opacity-40 line-through" : ""
                            } ${a.isOverride ? "ring-2 ring-amber-300" : ""} ${color}`}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <span className="truncate font-semibold">{a.staff?.name}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] opacity-80">
                              {a.shiftName} · {a.shiftStart}–{a.shiftEnd}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
