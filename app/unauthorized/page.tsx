"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* Shield Icon Badge */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-8 ring-red-500/5">
          <ShieldAlert className="h-10 w-10" />
        </div>

        {/* Main Heading & Subtitle */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Access Restricted
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have the required permissions or assigned role to view
          this page.
        </p>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="w-full rounded-md sm:w-1/2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>

          <Button
            variant="destructive"
            className="w-full rounded-md sm:w-1/2"
            onClick={() => signOut({ redirectUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
