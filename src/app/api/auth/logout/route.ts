import { NextResponse } from "next/server";

import { deleteCurrentSession } from "@/lib/auth/session";
import { serverError } from "@/lib/http";

export async function POST() {
  try {
    await deleteCurrentSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return serverError();
  }
}
