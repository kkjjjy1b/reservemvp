import { NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { serverError, unauthorized } from "@/lib/http";
import { getMyReservations } from "@/lib/reservations/service";
import { serializeMyReservation } from "@/lib/reservations/serialize";

export async function GET() {
  try {
    const session = await requireCurrentSession();
    const reservations = await getMyReservations(session.user.id);

    return NextResponse.json({
      reservations: reservations.map(serializeMyReservation),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("GET /api/me/reservations failed", error);
    return serverError();
  }
}
