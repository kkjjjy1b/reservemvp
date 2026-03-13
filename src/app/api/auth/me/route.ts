import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import { sanitizeUser } from "@/lib/auth/user";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: sanitizeUser(session.user),
  });
}
