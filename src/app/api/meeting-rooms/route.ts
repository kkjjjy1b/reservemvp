import { NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { unauthorized, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireCurrentSession();

    const meetingRooms = await prisma.meetingRoom.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      meetingRooms,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("GET /api/meeting-rooms failed", error);
    return serverError();
  }
}
