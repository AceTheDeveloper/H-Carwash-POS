"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn, orgRole } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Redirect unauthenticated users to sign-in
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    // Role-based routing using replace to clean browser history
    if (orgRole === "org:admin") {
      router.replace("/admin");
    } else if (orgRole === "org:member") {
      router.replace("/pos");
    }
  }, [isLoaded, isSignedIn, orgRole, router]);

  // Loading state with centered spinner while Clerk initializes
  if (
    !isLoaded ||
    (isSignedIn && (orgRole === "org:admin" || orgRole === "org:member"))
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle users signed in without an active organization or supported role
  if (isSignedIn && orgRole !== "org:admin" && orgRole !== "org:member") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-background">
        <h1 className="text-lg font-semibold text-foreground">
          Access Restricted
        </h1>
        <p className="text-sm text-muted-foreground">
          You do not have an assigned role for this organization.
        </p>
      </div>
    );
  }

  return null;
}
