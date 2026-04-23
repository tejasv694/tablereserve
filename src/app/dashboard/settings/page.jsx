"use client";

import { ArrowLeft, Settings, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Restaurant profile, hours, email settings
// TODO: Implement later
export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground sm:text-lg">Settings</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Restaurant configuration
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Construction className="h-7 w-7 text-orange-600" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-foreground">Coming Soon</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Restaurant profile, opening hours, email templates, and more settings are on the way.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
