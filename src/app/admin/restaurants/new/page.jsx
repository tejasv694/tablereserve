"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  AlertCircle,
  Globe,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PLANS = [
  {
    key: "TRIAL",
    label: "Trial",
    desc: "14-day free trial",
    icon: Clock,
    color: "border-sky-200 bg-sky-50 text-sky-700",
    selected: "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20",
  },
  {
    key: "BASIC",
    label: "Basic",
    desc: "Essential features",
    icon: Globe,
    color: "border-violet-200 bg-violet-50 text-violet-700",
    selected: "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20",
  },
  {
    key: "PRO",
    label: "Pro",
    desc: "All features unlocked",
    icon: Zap,
    color: "border-amber-200 bg-amber-50 text-amber-700",
    selected: "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20",
  },
];

export default function NewRestaurantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("TRIAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(slugify(val));
  };

  const handleCopy = () => {
    const text = [
      `Login URL: ${window.location.origin}/dashboard/login`,
      `Slug: ${credentials.slug}`,
      `Email: ${credentials.email}`,
      `Password: ${credentials.temporaryPassword}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, ownerName, ownerEmail, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create restaurant");
        setSubmitting(false);
        return;
      }

      setCredentials(data.credentials);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──
  if (credentials) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50/60 to-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Restaurant Created
            </h1>
            <p className="text-sm text-muted-foreground">
              Send these credentials to the restaurant owner so they can log in.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="space-y-3 pt-6">
              <div className="rounded-lg border border-orange-200/60 bg-orange-50/30 p-4 font-mono text-sm leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login URL</span>
                  <span className="text-foreground">/dashboard/login</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="text-foreground">{credentials.slug}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{credentials.email}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-semibold text-foreground">
                    {credentials.temporaryPassword}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{credentials.note}</p>

              <Button className="w-full gap-2" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Credentials
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Create Form ──
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              Add Restaurant
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Info */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">
                Restaurant Information
              </CardTitle>
              <CardDescription className="text-xs">
                Basic details about the restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Restaurant Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Mario's Ristorante"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium">
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mario-ristorante"
                  className="h-10 font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Booking page: <span className="font-mono">/{slug || "..."}/book</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">
                Owner Details
              </CardTitle>
              <CardDescription className="text-xs">
                The restaurant owner will receive login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ownerName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerEmail" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="mario@example.com"
                  className="h-10"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Plan</CardTitle>
              <CardDescription className="text-xs">
                Choose a subscription plan for this restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlan(p.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all ${
                      plan === p.key ? p.selected : `${p.color} opacity-60 hover:opacity-80`
                    }`}
                  >
                    <p.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{p.label}</span>
                    <span className="text-[11px] leading-tight opacity-70">
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="h-11 w-full font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Restaurant…
              </>
            ) : (
              "Create Restaurant"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This will create a new database, set up the schema, and generate
            login credentials for the restaurant owner.
          </p>
        </form>
      </main>
    </div>
  );
}
