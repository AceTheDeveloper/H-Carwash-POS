"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn, orgRole } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    if (orgRole === "org:admin") {
      router.push("/admin");
    } else if (orgRole === "org:member") {
      router.push("/pos");
    }
  }, [isLoaded, isSignedIn, orgRole, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please log in</div>;
  }

  // Handle users signed in without a supported role
  if (orgRole !== "org:admin" && orgRole !== "org:member") {
    return <div>No Access</div>;
  }

  return null;
}
