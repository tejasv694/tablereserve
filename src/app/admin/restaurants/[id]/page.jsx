"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  CalendarDays,
  BookOpen,
  Grid3X3,
  Users,
  KeyRound,
  Pause,
  Play,
  Trash2,
  Loader2,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

export default function ManageRestaurantPage() {
  const { id } = useParams();
  const router = useRouter();

  const [account, setAccount] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [resetCredentials, setResetCredentials] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAccount(data.account);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        if (action === "reset-password") {
          setResetCredentials(data.credentials);
        }
        fetchData();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Email: ${resetCredentials.email}\nPassword: ${resetCredentials.newPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50/60 to-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-3 text-sm">Loading restaurant…</p>
      </div>
    );
  }

  // ── Not found ──
  if (!account) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-orange-50/60 to-background">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Store className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Restaurant not found</p>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const status = STATUS_BADGE[account.status] || STATUS_BADGE.ACTIVE;
  const plan = PLAN_BADGE[account.plan] || PLAN_BADGE.TRIAL;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">
                {account.name}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                /{account.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${status.className}`}>
              {status.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${plan.className}`}>
              {plan.label}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-6 sm:px-6">
        {/* ─── Details ─── */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={User} label="Owner" value={account.ownerName} />
            <DetailRow icon={Mail} label="Email" value={account.ownerEmail} />
            <DetailRow
              icon={CalendarDays}
              label="Created"
              value={format(new Date(account.createdAt), "d MMMM yyyy")}
            />
          </CardContent>
        </Card>

        {/* ─── Stats ─── */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={BookOpen}
              value={stats.totalBookingsThisMonth}
              label="Bookings / mo"
              color="text-sky-600"
              bg="bg-sky-50"
            />
            <StatCard
              icon={Grid3X3}
              value={stats.totalTables}
              label="Tables"
              color="text-violet-600"
              bg="bg-violet-50"
            />
            <StatCard
              icon={Users}
              value={stats.totalStaff}
              label="Staff"
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </div>
        )}

        {/* ─── Reset Credentials ─── */}
        {resetCredentials && (
          <Card className="border-emerald-200 bg-emerald-50/50 shadow-none">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">
                  New Credentials Generated
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-white p-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{resetCredentials.email}</span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-semibold text-foreground">{resetCredentials.newPassword}</span>
                </div>
              </div>
              <Button size="sm" className="gap-1.5" onClick={handleCopyCredentials}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Credentials
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ─── Quick Actions ─── */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs">
              Manage this restaurant account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="h-10 w-full justify-start gap-2 text-sm"
              disabled={!!actionLoading}
              onClick={() => handleAction("reset-password")}
            >
              {actionLoading === "reset-password" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              )}
              Reset Staff Password
            </Button>

            {account.status === "ACTIVE" && (
              <Button
                variant="outline"
                className="h-10 w-full justify-start gap-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                disabled={!!actionLoading}
                onClick={() => handleAction("suspend")}
              >
                {actionLoading === "suspend" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Suspend Account
              </Button>
            )}

            {account.status === "SUSPENDED" && (
              <Button
                variant="outline"
                className="h-10 w-full justify-start gap-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                disabled={!!actionLoading}
                onClick={() => handleAction("reactivate")}
              >
                {actionLoading === "reactivate" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Reactivate Account
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ─── Danger Zone ─── */}
        <Card className="border-destructive/20 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="h-10 w-full justify-start gap-2 border-destructive/30 text-sm text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Restaurant & All Data
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* ─── Delete Dialog ─── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Restaurant</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently delete{" "}
              <strong className="text-foreground">{account.name}</strong>, drop
              their database, and remove all data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-1.5"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Forever"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Reusable sub-components ──

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col items-center gap-2 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
