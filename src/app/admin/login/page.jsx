"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/admin-auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/admin-auth/callback/admin-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          callbackUrl: "/admin",
          json: "true",
        }),
        redirect: "manual",
      });

      if (res.ok || res.status === 302 || res.status === 200) {
        const data = await res.json().catch(() => null);
        if (data?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/admin");
          router.refresh();
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-8 bg-gradient-to-br from-red-100 to-orange-100">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">👨‍💼</div>
          <h1 className="text-4xl font-serif font-bold text-orange-900">
            Admin Portal
          </h1>
          <p className="text-lg text-orange-800">
            Manage your TableReserve platform
          </p>
          <div className="pt-8 space-y-4 text-left text-sm text-orange-700">
            <div className="flex gap-3">
              <span>✓</span>
              <span>Oversee all restaurants</span>
            </div>
            <div className="flex gap-3">
              <span>✓</span>
              <span>Monitor platform health</span>
            </div>
            <div className="flex gap-3">
              <span>✓</span>
              <span>Manage administrators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Branding - Mobile */}
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="text-4xl">👨‍💼</div>
            <h1 className="text-2xl font-serif font-bold text-orange-900">
              Admin Portal
            </h1>
          </div>

          {/* Login Card */}
          <Card className="border-orange-200 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Authorized personnel only
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@platform.com"
                    className="h-11 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full text-base font-semibold bg-primary hover:bg-orange-600 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Back to home link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary hover:text-orange-600 font-medium transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
