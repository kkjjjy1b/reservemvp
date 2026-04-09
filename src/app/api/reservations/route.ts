import { Prisma } from "@prisma/client";
import { after, NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { sendReservationCreatedNotifications } from "@/lib/notifications/reservation-email";
import { prisma } from "@/lib/prisma";
import {
  getRandomReservationColorKey,
  isReservationColorKey,
} from "@/lib/reservations/colors";
import { formatKstTime, isValidDateKey } from "@/lib/reservations/datetime";
import {
  countWeekdaysInRange,
  getWeekdayRecurringLimitMessage,
  MAX_WEEKDAY_RECURRING_OCCURRENCES,
} from "@/lib/reservations/recurring";
import { serializeMutationReservation } from "@/lib/reservations/serialize";
import {
  normalizeParticipantUserIds,
  resolveParticipantUsers,
} from "@/lib/reservations/participants";
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
  participantUserIds?: string[];
  repeatWeekdays?: boolean;
  repeatStartDate?: string;
  repeatEndDate?: string;
};

export const preferredRegion = "icn1";

const RESERVATION_INCLUDE = {
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
} as const;

type ReservationCandidate = {
  reservationDate: string;
  startDatetime: Date;
  endDatetime: Date;
};

type CreatedReservation = Prisma.ReservationGetPayload<{
  include: typeof RESERVATION_INCLUDE;
}>;

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

    const reservationDate = body.reservationDate;
    const participantUserIds = normalizeParticipantUserIds(body.participantUserIds);

    if (participantUserIds === null) {
      return badRequest("참여자 정보가 올바르지 않습니다.");
    }

    const startDatetime = new Date(body.startDatetime);
    const endDatetime = new Date(body.endDatetime);
    const colorKey =
      body.colorKey && isReservationColorKey(body.colorKey)
        ? body.colorKey
        : getRandomReservationColorKey();
    const isRecurring = body.repeatWeekdays === true;

    const meetingRoom = await ensureActiveMeetingRoom(body.meetingRoomId);

    if (!meetingRoom) {
      return badRequest("예약 가능한 회의실이 아닙니다.");
    }

    const participantUsers = await resolveParticipantUsers({
      teamId: session.user.team?.id,
      ownerUserId: session.user.id,
      participantUserIds,
    });

    if (participantUsers.error) {
      return participantUsers.error;
    }

    const candidates = isRecurring
      ? buildWeekdayRecurringCandidates({
          repeatStartDate: body.repeatStartDate,
          repeatEndDate: body.repeatEndDate,
          startDatetime,
          endDatetime,
        })
      : [{ reservationDate, startDatetime, endDatetime }];

    if ("message" in candidates) {
      return badRequest(candidates.message);
    }

    for (const candidate of candidates) {
      const validationError = validateReservationCreateWindow({
        reservationDate: candidate.reservationDate,
        startDatetime: candidate.startDatetime,
        endDatetime: candidate.endDatetime,
      });

      if (validationError) {
        return badRequest(
          isRecurring
            ? `${candidate.reservationDate} 예약은 ${validationError}`
            : validationError,
        );
      }

      const conflict = await findReservationConflict({
        meetingRoomId: body.meetingRoomId,
        startDatetime: candidate.startDatetime,
        endDatetime: candidate.endDatetime,
      });

      if (conflict) {
        return badRequest(
          isRecurring
            ? `${candidate.reservationDate} 예약이 기존 예약과 겹쳐 반복 예약을 생성할 수 없습니다.`
            : "현재 예약이 불가능한 시간입니다.",
        );
      }
    }

    const createdReservations = await prisma.$transaction(async (tx) => {
      const created: CreatedReservation[] = [];

      for (const candidate of candidates) {
        const reservation = await tx.reservation.create({
          data: {
            userId: session.user.id,
            meetingRoomId: body.meetingRoomId!,
            reservationDate: new Date(`${candidate.reservationDate}T00:00:00.000Z`),
            startDatetime: candidate.startDatetime,
            endDatetime: candidate.endDatetime,
            colorKey,
            purpose: body.purpose?.trim() || null,
            participants:
              participantUsers.users.length > 0
                ? {
                    create: participantUsers.users.map((user) => ({
                      userId: user.id,
                    })),
                  }
                : undefined,
          },
          include: RESERVATION_INCLUDE,
        });

        created.push(reservation);
      }

      return created;
    });

    if (!isRecurring && createdReservations[0]) {
      const reservation = createdReservations[0];

      after(async () => {
        await sendReservationCreatedNotifications({
          reservationId: reservation.id,
          roomName: reservation.meetingRoom.name,
          reservationDate,
          startDatetime,
          endDatetime,
          purpose: reservation.purpose,
          ownerName: session.user.name,
          ownerEmail: session.user.companyEmail,
          participants: participantUsers.users.map((user) => ({
            name: user.name,
            companyEmail: user.companyEmail,
          })),
        }).catch((error) => {
          console.error("Reservation participant email notification failed", error);
        });
      });

      return NextResponse.json({
        reservation: serializeMutationReservation(reservation),
      });
    }

    return NextResponse.json({
      reservations: createdReservations.map((reservation) =>
        serializeMutationReservation(reservation),
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("POST /api/reservations failed", error);
    return serverError();
  }
}

function buildWeekdayRecurringCandidates(params: {
  repeatStartDate?: string;
  repeatEndDate?: string;
  startDatetime: Date;
  endDatetime: Date;
}): ReservationCandidate[] | { message: string } {
  if (!params.repeatStartDate || !params.repeatEndDate) {
    return { message: "반복 시작일과 반복 종료일이 필요합니다." };
  }

  if (!isValidDateKey(params.repeatStartDate) || !isValidDateKey(params.repeatEndDate)) {
    return { message: "반복 기간 날짜 형식이 올바르지 않습니다." };
  }

  if (params.repeatStartDate > params.repeatEndDate) {
    return { message: "반복 종료일은 반복 시작일보다 빠를 수 없습니다." };
  }

  const weekdayCount = countWeekdaysInRange(params.repeatStartDate, params.repeatEndDate);

  if (weekdayCount === 0) {
    return { message: "선택한 기간에 생성할 평일 예약이 없습니다." };
  }

  if (weekdayCount > MAX_WEEKDAY_RECURRING_OCCURRENCES) {
    return { message: getWeekdayRecurringLimitMessage() };
  }

  const startTime = formatKstTime(params.startDatetime);
  const durationMs = params.endDatetime.getTime() - params.startDatetime.getTime();
  const candidates: ReservationCandidate[] = [];

  let cursor = new Date(`${params.repeatStartDate}T00:00:00.000Z`);
  const end = new Date(`${params.repeatEndDate}T00:00:00.000Z`);

  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.getUTCDay();

    if (day >= 1 && day <= 5) {
      const reservationDate = cursor.toISOString().slice(0, 10);
      const startDatetime = buildUtcDatetime(reservationDate, startTime);
      const endDatetime = new Date(startDatetime.getTime() + durationMs);

      candidates.push({
        reservationDate,
        startDatetime,
        endDatetime,
      });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return candidates;
}

function buildUtcDatetime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return new Date(utcTime);
}
