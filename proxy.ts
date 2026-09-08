import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ALLOWED_POS_ROLES = ["org:admin", "org:member"];

const publicRoutes = ["/login", "/sign-in", "/sso-callback", "/unauthorized"];

function isPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, orgRole } = await auth();
  const { pathname } = req.nextUrl;

  const url = new URL(req.url);

  const isApiRoute = isPath(pathname, "/api") || isPath(pathname, "/trpc");

  if (isApiRoute && !userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (isPath(pathname, "/api/admin") && orgRole !== "org:admin") {
    return NextResponse.json(
      { message: "Forbidden: Admin access required" },
      { status: 403 },
    );
  }

  if (!isApiRoute && !userId && !publicRoutes.includes(pathname)) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isApiRoute) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  if (!userId && !isPublicRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!orgId) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (pathname === "/dashboard") {
    if (orgRole === "org:admin") {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    } else if (orgRole === "org:member") {
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    } else {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  if (isPath(pathname, "/admin") && orgRole !== "org:admin") {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (
    isPath(pathname, "/pos") &&
    (!orgRole || !ALLOWED_POS_ROLES.includes(orgRole))
  ) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
