import { NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  getRandomReservationColorKey,
  isReservationColorKey,
} from "@/lib/reservations/colors";
import {
  serializeMutationReservation,
} from "@/lib/reservations/serialize";
import {
  ensureActiveMeetingRoom,
  findReservationConflict,
  getActiveMeetingRooms,
  getDailyReservations,
} from "@/lib/reservations/service";
import { buildTimelineResponse } from "@/lib/reservations/timeline";
import { validateReservationCreateWindow } from "@/lib/reservations/validation";

type CreateReservationBody = {
  meetingRoomId?: string;
  reservationDate?: string;
  startDatetime?: string;
  endDatetime?: string;
  purpose?: string;
  colorKey?: string;
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireCurrentSession();

    const reservationDate = request.nextUrl.searchParams.get("date");

    if (!reservationDate) {
      return badRequest("조회 날짜가 필요합니다.");
    }

    const [rooms, reservations] = await Promise.all([
      getActiveMeetingRooms(),
      getDailyReservations(reservationDate),
    ]);

    return NextResponse.json(
      buildTimelineResponse({
        date: reservationDate,
        currentUserId: session.user.id,
        rooms,
        reservations,
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("GET /api/reservations failed", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireCurrentSession();
    const body = (await request.json()) as CreateReservationBody;

    if (!body.meetingRoomId || !body.reservationDate || !body.startDatetime || !body.endDatetime) {
      return badRequest("회의실, 날짜, 시작 시간, 종료 시간은 필수입니다.");
    }

    const startDatetime = new Date(body.startDatetime);
    const endDatetime = new Date(body.endDatetime);
    const colorKey =
      body.colorKey && isReservationColorKey(body.colorKey)
        ? body.colorKey
        : getRandomReservationColorKey();

    const validationError = validateReservationCreateWindow({
      reservationDate: body.reservationDate,
      startDatetime,
      endDatetime,
    });

    if (validationError) {
      return badRequest(validationError);
    }

    const meetingRoom = await ensureActiveMeetingRoom(body.meetingRoomId);

    if (!meetingRoom) {
      return badRequest("예약 가능한 회의실이 아닙니다.");
    }

    const conflict = await findReservationConflict({
      meetingRoomId: body.meetingRoomId,
      startDatetime,
      endDatetime,
    });

    if (conflict) {
      return badRequest("현재 예약이 불가능한 시간입니다.");
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        meetingRoomId: body.meetingRoomId,
        reservationDate: new Date(`${body.reservationDate}T00:00:00.000Z`),
        startDatetime,
        endDatetime,
        colorKey,
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
      reservation: serializeMutationReservation(reservation),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("POST /api/reservations failed", error);
    return serverError();
  }
}
