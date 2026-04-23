"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Protects a page based on staff role.
 * @param {object} props
 * @param {string[]} props.allowed - Array of allowed roles, e.g. ["OWNER", "MANAGER"]
 * @param {React.ReactNode} props.children
 */
export default function RoleGuard({ allowed, children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  useEffect(() => {
    if (status === "authenticated" && role && !allowed.includes(role)) {
      router.replace("/dashboard");
    }
  }, [status, role, allowed, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return null;
  }

  return children;
}
