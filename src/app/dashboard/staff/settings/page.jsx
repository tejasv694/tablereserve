"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Save, Loader2, Plus, Trash2,
  ChefHat, ConciergeBell, Truck, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const DEPARTMENTS = [
  { key: "KITCHEN", label: "Kitchen", icon: ChefHat },
  { key: "FRONT", label: "Front / Serving", icon: ConciergeBell },
  { key: "DELIVERY", label: "Delivery", icon: Truck },
  { key: "MANAGER", label: "Manager", icon: ShieldCheck },
];

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function ShiftConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable state
  const [minStaff, setMinStaff] = useState({ KITCHEN: 2, FRONT: 3, DELIVERY: 1, MANAGER: 1 });
  const [minTotal, setMinTotal] = useState(7);
  const [shiftMode, setShiftMode] = useState("CONSTANT");
  const [shiftSlots, setShiftSlots] = useState([
    { name: "Morning", start: "08:00", end: "16:00" },
    { name: "Evening", start: "14:00", end: "22:00" },
  ]);
  const [deadlineDay, setDeadlineDay] = useState("WEDNESDAY");
  const [releaseDay, setReleaseDay] = useState("THURSDAY");
  const [releaseTime, setReleaseTime] = useState("00:05");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shift-config");
        if (res.ok) {
          const data = await res.json();
          const c = data.config;
          setConfig(c);
          const parsed = typeof c.minStaffPerRole === "string" ? JSON.parse(c.minStaffPerRole) : c.minStaffPerRole;
          setMinStaff(parsed || { KITCHEN: 2, FRONT: 3, DELIVERY: 1, MANAGER: 1 });
          setMinTotal(c.minTotalStaff || 7);
          setShiftMode(c.shiftMode || "CONSTANT");
          const slots = typeof c.shiftSlots === "string" ? JSON.parse(c.shiftSlots) : c.shiftSlots;
          setShiftSlots(slots || []);
          setDeadlineDay(c.availabilityDeadlineDay || "WEDNESDAY");
          setReleaseDay(c.planReleaseDay || "THURSDAY");
          setReleaseTime(c.planReleaseTime || "00:05");
        }
      } catch (err) {
        console.error("Fetch config failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shift-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minStaffPerRole: minStaff,
          minTotalStaff: minTotal,
          shiftMode,
          shiftSlots,
          availabilityDeadlineDay: deadlineDay,
          planReleaseDay: releaseDay,
          planReleaseTime: releaseTime,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Save config failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50/60 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading configuration…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/dashboard/staff"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-base font-bold text-foreground sm:text-lg">Shift Configuration</h1>
          </div>
          <Button size="sm" className="h-9 gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Save className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save</>}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {/* Minimum Staff Per Role */}
        <Card className="border-orange-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Minimum Staff Per Day</CardTitle>
            <CardDescription>How many people from each department are needed daily?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEPARTMENTS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="w-32 text-sm font-medium">{d.label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={minStaff[d.key] || 0}
                    onChange={(e) => setMinStaff({ ...minStaff, [d.key]: parseInt(e.target.value) || 0 })}
                    className="h-9 w-20 border-orange-200/60"
                  />
                </div>
              );
            })}
            <div className="flex items-center gap-3 border-t border-orange-200/40 pt-3">
              <span className="w-32 pl-8 text-sm font-semibold">Total minimum</span>
              <Input
                type="number"
                min={1}
                value={minTotal}
                onChange={(e) => setMinTotal(parseInt(e.target.value) || 1)}
                className="h-9 w-20 border-orange-200/60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shift Slots */}
        <Card className="border-orange-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shift Slots</CardTitle>
            <CardDescription>Define your shift time blocks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shiftSlots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={slot.name}
                  onChange={(e) => {
                    const updated = [...shiftSlots];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setShiftSlots(updated);
                  }}
                  placeholder="Shift name"
                  className="h-9 flex-1 border-orange-200/60"
                />
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) => {
                    const updated = [...shiftSlots];
                    updated[i] = { ...updated[i], start: e.target.value };
                    setShiftSlots(updated);
                  }}
                  className="h-9 w-28 border-orange-200/60"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={slot.end}
                  onChange={(e) => {
                    const updated = [...shiftSlots];
                    updated[i] = { ...updated[i], end: e.target.value };
                    setShiftSlots(updated);
                  }}
                  className="h-9 w-28 border-orange-200/60"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                  onClick={() => setShiftSlots(shiftSlots.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShiftSlots([...shiftSlots, { name: "", start: "08:00", end: "16:00" }])}
            >
              <Plus className="h-4 w-4" />Add Shift Slot
            </Button>
          </CardContent>
        </Card>

        {/* Shift Mode */}
        <Card className="border-orange-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shift Mode</CardTitle>
            <CardDescription>How shift timings are assigned each week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[
                { key: "CONSTANT", label: "Constant", desc: "Same shift times, only days change" },
                { key: "SHUFFLE", label: "Shuffle", desc: "Rotate between shift times weekly" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setShiftMode(m.key)}
                  className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
                    shiftMode === m.key
                      ? "border-primary bg-primary/5"
                      : "border-orange-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card className="border-orange-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>When staff must submit availability and when the plan is released</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="w-40 text-sm">Availability deadline</Label>
              <select
                value={deadlineDay}
                onChange={(e) => setDeadlineDay(e.target.value)}
                className="h-9 rounded-lg border border-orange-200/60 bg-white px-3 text-sm"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-40 text-sm">Plan release day</Label>
              <select
                value={releaseDay}
                onChange={(e) => setReleaseDay(e.target.value)}
                className="h-9 rounded-lg border border-orange-200/60 bg-white px-3 text-sm"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-40 text-sm">Release time</Label>
              <Input
                type="time"
                value={releaseTime}
                onChange={(e) => setReleaseTime(e.target.value)}
                className="h-9 w-28 border-orange-200/60"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
