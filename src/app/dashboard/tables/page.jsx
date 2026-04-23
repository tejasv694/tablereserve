"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Grid3X3,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import TableGrid from "@/components/dashboard/TableGrid";
import Link from "next/link";

export default function TablesPage() {
  const { data: session } = useSession();
  const slug = session?.user?.restaurantSlug;

  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formLabel, setFormLabel] = useState("");
  const [formCapacity, setFormCapacity] = useState(4);
  const [formMinCapacity, setFormMinCapacity] = useState(1);
  const [formSection, setFormSection] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsOnline, setFormIsOnline] = useState(true);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [tablesRes, bookingsRes] = await Promise.all([
        fetch(`/api/tables?slug=${slug}`),
        fetch(`/api/bookings?slug=${slug}&date=${today}&limit=100`),
      ]);
      if (tablesRes.ok) {
        const data = await tablesRes.json();
        setTables(data.tables || []);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch tables data:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateSheet = () => {
    setEditTable(null);
    setFormLabel("");
    setFormCapacity(4);
    setFormMinCapacity(1);
    setFormSection("");
    setFormIsActive(true);
    setFormIsOnline(true);
    setSheetOpen(true);
  };

  const openEditSheet = (table) => {
    setEditTable(table);
    setFormLabel(table.label);
    setFormCapacity(table.capacity);
    setFormMinCapacity(table.minCapacity || 1);
    setFormSection(table.section || "");
    setFormIsActive(table.isActive);
    setFormIsOnline(table.isOnline);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!slug || !formLabel) return;
    setSaving(true);

    try {
      if (editTable) {
        // Update
        const res = await fetch(`/api/tables/${editTable.id}?slug=${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: formLabel,
            capacity: formCapacity,
            minCapacity: formMinCapacity,
            section: formSection || undefined,
            isActive: formIsActive,
            isOnline: formIsOnline,
          }),
        });
        if (res.ok) {
          setSheetOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            label: formLabel,
            capacity: formCapacity,
            minCapacity: formMinCapacity,
            section: formSection || undefined,
            isActive: formIsActive,
            isOnline: formIsOnline,
          }),
        });
        if (res.ok) {
          setSheetOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      console.error("Save table error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTable || !slug) return;
    if (!window.confirm(`Delete "${editTable.label}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tables/${editTable.id}?slug=${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSheetOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Delete table error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">Tables</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {tables.length} tables configured
              </p>
            </div>
          </div>
          <Button size="sm" className="h-9 gap-1.5" onClick={openCreateSheet}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Table</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">Loading tables…</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <Grid3X3 className="h-6 w-6 text-orange-600" />
            </div>
            <p className="mt-4 font-medium text-foreground">No tables yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first table to get started</p>
            <Button className="mt-5 gap-1.5" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Add Table
            </Button>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-lg border border-orange-200/60 bg-white px-4 py-2.5 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Booking soon
              </span>
            </div>

            <TableGrid
              tables={tables}
              bookings={bookings}
              onTableTap={openEditSheet}
            />
          </>
        )}
      </main>

      {/* Edit/Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editTable ? `Edit ${editTable.label}` : "New Table"}
            </SheetTitle>
            <SheetDescription>
              {editTable
                ? "Update table settings and waiter assignment."
                : "Add a new table to your restaurant."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5 px-1">
            <div>
              <Label className="mb-1.5 text-sm font-medium">Label *</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Table 1"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 text-sm font-medium">Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="mb-1.5 text-sm font-medium">Min Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formMinCapacity}
                  onChange={(e) => setFormMinCapacity(Number(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 text-sm font-medium">Section</Label>
              <Input
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                placeholder="Terrace, Indoor, etc."
                className="h-10"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-orange-200/60 bg-orange-50/20 p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Include in booking assignments
                </p>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-orange-200/60 bg-orange-50/20 p-3">
              <div>
                <p className="text-sm font-medium">Online</p>
                <p className="text-xs text-muted-foreground">
                  Shown on public booking page
                </p>
              </div>
              <Switch
                checked={formIsOnline}
                onCheckedChange={setFormIsOnline}
              />
            </div>

            <Button
              className="h-11 w-full font-semibold"
              disabled={saving || !formLabel}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editTable ? (
                "Save Changes"
              ) : (
                "Create Table"
              )}
            </Button>

            {editTable && (
              <Button
                variant="outline"
                className="h-11 w-full gap-1.5 border-destructive/30 font-semibold text-destructive hover:bg-destructive/5"
                disabled={saving}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete Table
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
