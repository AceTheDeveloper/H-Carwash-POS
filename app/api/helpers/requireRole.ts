import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AllowedRole = "org:admin" | "org:member";

type AuthResult =
  | { userId: string; orgId: string; orgRole: string; error?: never }
  | { error: NextResponse; userId?: never; orgId?: never; orgRole?: never };

export async function requireRole(
  allowedRoles: AllowedRole | AllowedRole[],
): Promise<AuthResult> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const rolesToCheck = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!orgId || !orgRole || !rolesToCheck.includes(orgRole as AllowedRole)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { userId, orgId, orgRole };
}
