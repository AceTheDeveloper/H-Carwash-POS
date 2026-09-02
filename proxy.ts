import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgRole } = await auth();
  const { pathname } = req.nextUrl;

  // Ignore API routes, static files, and Next.js internal requests
  const isApiRoute =
    pathname.startsWith("/api") || pathname.startsWith("/trpc");
  const isPublicAsset = pathname.includes(".");

  if (isApiRoute || isPublicAsset) {
    return;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
