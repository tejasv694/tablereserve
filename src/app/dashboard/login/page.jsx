"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      slug,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials. Please check your restaurant URL, email and password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-8 bg-gradient-to-br from-orange-100 to-red-100">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🍽️</div>
          <h1 className="text-4xl font-serif font-bold text-orange-900">
            TableReserve
          </h1>
          <p className="text-lg text-orange-800">
            Manage your restaurant's reservations with ease
          </p>
          <div className="pt-8 space-y-4 text-left text-sm text-orange-700">
            <div className="flex gap-3">
              <span>✓</span>
              <span>Real-time booking management</span>
            </div>
            <div className="flex gap-3">
              <span>✓</span>
              <span>Smart table assignment</span>
            </div>
            <div className="flex gap-3">
              <span>✓</span>
              <span>Staff coordination tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <h1 className="text-2xl font-serif font-bold text-orange-900">TableReserve</h1>
          </div>

          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-orange-900">Staff Login</CardTitle>
              <CardDescription className="text-base">
                Sign in to your restaurant dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="slug" className="mb-2 text-base font-medium text-foreground">
                    Restaurant URL
                  </Label>
                  <Input
                    id="slug"
                    placeholder="mario-ristorante"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    className="h-11 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    The slug from your restaurant URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2 text-base font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="you@restaurant.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="mb-2 text-base font-medium text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full text-base font-semibold bg-primary hover:bg-orange-600 text-primary-foreground"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="#" className="font-medium text-primary hover:text-orange-600">
                  Contact support
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
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
