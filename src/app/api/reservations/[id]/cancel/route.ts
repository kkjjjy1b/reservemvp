import { NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { forbidden, serverError, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { serializeMutationReservation } from "@/lib/reservations/serialize";
import { getReservationById } from "@/lib/reservations/service";

export const preferredRegion = "icn1";

type ReservationCancelContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: NextRequest, context: ReservationCancelContext) {
  try {
    const session = await requireCurrentSession();
    const { id } = await context.params;
    const reservation = await getReservationById(id);

    if (!reservation || reservation.status === "cancelled") {
      return NextResponse.json({ message: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    if (reservation.userId !== session.user.id) {
      return forbidden("내 예약만 취소할 수 있습니다.");
    }

    const cancelledReservation = await prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        status: "cancelled",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyEmail: true,
            avatarUrl: true,
          },
        },
        participants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                companyEmail: true,
                avatarUrl: true,
              },
            },
          },
        },
        meetingRoom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      reservation: serializeMutationReservation(cancelledReservation),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("POST /api/reservations/[id]/cancel failed", error);
    return serverError();
  }
}
