import { NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { badRequest, forbidden, serverError, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  serializeMutationReservation,
  serializeReservationDetail,
} from "@/lib/reservations/serialize";
import { findReservationConflict, getReservationById } from "@/lib/reservations/service";
import {
  canEditReservation,
  validateReservationUpdateWindow,
} from "@/lib/reservations/validation";

export const preferredRegion = "icn1";

type ReservationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateReservationBody = {
  startDatetime?: string;
  endDatetime?: string;
  purpose?: string;
};

export async function GET(_: NextRequest, context: ReservationRouteContext) {
  try {
    const session = await requireCurrentSession();
    const { id } = await context.params;
    const reservation = await getReservationById(id);

    if (!reservation || reservation.status === "cancelled") {
      return NextResponse.json({ message: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      reservation: serializeReservationDetail(reservation),
      canEdit: reservation.userId === session.user.id && canEditReservation(reservation.startDatetime),
      canCancel: reservation.userId === session.user.id,
      isMine: reservation.userId === session.user.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("GET /api/reservations/[id] failed", error);
    return serverError();
  }
}

export async function PATCH(request: NextRequest, context: ReservationRouteContext) {
  try {
    const session = await requireCurrentSession();
    const { id } = await context.params;
    const reservation = await getReservationById(id);

    if (!reservation || reservation.status === "cancelled") {
      return NextResponse.json({ message: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    if (reservation.userId !== session.user.id) {
      return forbidden("내 예약만 수정할 수 있습니다.");
    }

    if (!canEditReservation(reservation.startDatetime)) {
      return badRequest("예약 시작 시간이 지난 뒤에는 수정할 수 없습니다.");
    }

    const body = (await request.json()) as UpdateReservationBody;

    if (!body.startDatetime || !body.endDatetime) {
      return badRequest("시작 시간과 종료 시간은 필수입니다.");
    }

    const startDatetime = new Date(body.startDatetime);
    const endDatetime = new Date(body.endDatetime);
    const validationError = validateReservationUpdateWindow({
      reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
      startDatetime,
      endDatetime,
    });

    if (validationError) {
      return badRequest(validationError);
    }

    const conflict = await findReservationConflict({
      meetingRoomId: reservation.meetingRoomId,
      startDatetime,
      endDatetime,
      excludeReservationId: reservation.id,
    });

    if (conflict) {
      return badRequest("현재 예약이 불가능한 시간입니다.");
    }

    const updatedReservation = await prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        startDatetime,
        endDatetime,
        purpose: body.purpose?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
      reservation: serializeMutationReservation(updatedReservation),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("PATCH /api/reservations/[id] failed", error);
    return serverError();
  }
}
