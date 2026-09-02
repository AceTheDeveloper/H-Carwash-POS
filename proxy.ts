import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgRole, sessionStatus } = await auth();
  const { pathname } = req.nextUrl;

  const isApiRoute =
    pathname.startsWith("/api") || pathname.startsWith("/trpc");
  const isPublicAsset = pathname.includes(".");

  // 1. Skip middleware for API routes and static files
  if (isApiRoute || isPublicAsset) {
    return;
  }

  // 2. Unauthenticated check -> redirect to login
  if (!userId || sessionStatus !== "active") {
    // Prevent redirect loop if they are already on the login page
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return;
  }

  // 3. Role-based routing with loop protection
  // if (orgRole === "org:admin") {
  //   // Only redirect if they are NOT already inside /admin
  //   if (!pathname.startsWith("/admin")) {
  //     return NextResponse.redirect(new URL("/admin", req.url));
  //   }
  // }

  if (orgRole === "org:member") {
    // Only redirect if they are NOT already inside /pos (fixed typo from "org:member]")
    if (!pathname.startsWith("/pos")) {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
