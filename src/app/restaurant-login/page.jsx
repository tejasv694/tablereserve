"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, UtensilsCrossed } from "lucide-react";

export default function RestaurantLoginChoice() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 via-red-50 to-amber-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif font-bold text-orange-700">
            🍽️ TableReserve
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Restaurant Login
            </h1>
            <p className="text-muted-foreground">
              Select your role to continue
            </p>
          </div>

          <div className="space-y-4">
            {/* Owner / Manager Option */}
            <Link
              href="/dashboard/login"
              className="block p-6 bg-white rounded-xl border-2 border-orange-200 hover:border-primary hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-semibold text-foreground">
                    Owner / Manager
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Full access to bookings, staff, tables, and settings
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            {/* Staff / Waiter Option */}
            <Link
              href="/dashboard/login"
              className="block p-6 bg-white rounded-xl border-2 border-orange-200 hover:border-primary hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition">
                  <UtensilsCrossed className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-semibold text-foreground">
                    Staff / Waiter
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View and manage bookings only
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Your access level is determined by your account credentials
          </p>
        </div>
      </main>
    </div>
  );
}
