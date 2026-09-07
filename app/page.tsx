"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Using the same icon library from your app

export default function RootRedirectPage() {
  const { isLoaded, isSignedIn, orgRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Wait until Clerk has fully loaded the auth state
    if (!isLoaded) return;

    // 2. If not signed in, boot them to login
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    // 3. Handle role-based routing
    if (orgRole === "org:admin") {
      router.replace("/dashboard");
    } else if (orgRole === "org:member") {
      router.replace("/pos");
    }
  }, [isLoaded, isSignedIn, orgRole, router]); // Added missing dependencies

  // 5. Show a clean loading state instead of unstyled text
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
        Authenticating...
      </p>
    </div>
  );
}
