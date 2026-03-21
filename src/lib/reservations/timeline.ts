import { ReservationStatus } from "@prisma/client";

import {
  isReservationColorKey,
  type ReservationColorKey,
} from "@/lib/reservations/colors";
import {
  formatKstTime,
  getTimelineSlotIndex,
} from "@/lib/reservations/datetime";
import {
  SLOT_MINUTES,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "@/lib/reservations/constants";
import type {
  TimelineReservation,
  TimelineResponse,
  TimelineRoom,
} from "@/lib/reservations/types";

type TimelineMeetingRoom = {
  id: string;
  name: string;
  capacity: number | null;
  location: string | null;
  description: string | null;
};

type TimelineReservationRecord = {
  id: string;
  meetingRoomId: string;
  colorKey: string;
  purpose: string | null;
  status: ReservationStatus;
  startDatetime: Date;
  endDatetime: Date;
  user: {
    id: string;
    name: string;
    companyEmail?: string | null;
    avatarUrl?: string | null;
  };
  participants?: Array<{
    user: {
      id: string;
      name: string;
      companyEmail?: string | null;
      avatarUrl?: string | null;
    };
  }>;
};

function toTimelineReservation(
  reservation: TimelineReservationRecord,
  currentUserId: string,
): TimelineReservation {
  const startSlotIndex = getTimelineSlotIndex(reservation.startDatetime);
  const slotSpan =
    (reservation.endDatetime.getTime() - reservation.startDatetime.getTime()) /
    (SLOT_MINUTES * 60 * 1000);
  const endSlotIndex = startSlotIndex + slotSpan;
  const timelineSlotCount =
    ((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60) / SLOT_MINUTES;

  return {
    id: reservation.id,
    title: reservation.purpose,
    colorKey: isReservationColorKey(reservation.colorKey) ? reservation.colorKey : "sky",
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    startTime: formatKstTime(reservation.startDatetime),
    endTime: endSlotIndex === timelineSlotCount ? "24:00" : formatKstTime(reservation.endDatetime),
    startSlotIndex,
    endSlotIndex,
    slotSpan,
    user: {
      name: reservation.user.name,
      id: reservation.user.id,
      companyEmail: reservation.user.companyEmail ?? undefined,
      avatarUrl: reservation.user.avatarUrl ?? null,
      avatarSeed: reservation.user.companyEmail ?? reservation.user.id,
    },
    participants:
      reservation.participants?.map(({ user }) => ({
        id: user.id,
        name: user.name,
        companyEmail: user.companyEmail ?? undefined,
        avatarUrl: user.avatarUrl ?? null,
        avatarSeed: user.companyEmail ?? user.id,
      })) ?? [],
    isMine: reservation.user.id === currentUserId,
    status: "active",
  };
}

export function buildTimelineResponse(params: {
  date: string;
  currentUserId: string;
  rooms: TimelineMeetingRoom[];
  reservations: TimelineReservationRecord[];
}): TimelineResponse {
  const reservationsByRoomId = new Map<string, TimelineReservation[]>();

  for (const reservation of params.reservations) {
    const roomReservations = reservationsByRoomId.get(reservation.meetingRoomId) ?? [];
    roomReservations.push(toTimelineReservation(reservation, params.currentUserId));
    reservationsByRoomId.set(reservation.meetingRoomId, roomReservations);
  }

  const rooms: TimelineRoom[] = params.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    location: room.location,
    description: room.description,
    reservations: reservationsByRoomId.get(room.id) ?? [],
  }));

  return {
    date: params.date,
    timeline: {
      startTime: "06:00",
      endTime: "24:00",
      slotMinutes: SLOT_MINUTES as 30,
      slotCount: (((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60) / SLOT_MINUTES) as 36,
    },
    rooms,
  };
}
