import { Reservation, ReservationStatus } from "@prisma/client";

import { getAvatarSeed } from "@/lib/auth/user";
import { isReservationColorKey } from "@/lib/reservations/colors";
import { formatKstTime } from "@/lib/reservations/datetime";

export function serializeReservationStatus(status: ReservationStatus) {
  return status;
}

type ReservationWithRelations = Reservation & {
  user?: {
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
  meetingRoom?: { id: string; name: string };
};

function normalizeColorKey(colorKey: string) {
  return isReservationColorKey(colorKey) ? colorKey : "sky";
}

function serializeReservationPerson(user: {
  id: string;
  name: string;
  companyEmail?: string | null;
  avatarUrl?: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    companyEmail: user.companyEmail ?? undefined,
    avatarUrl: user.avatarUrl ?? null,
    avatarSeed: getAvatarSeed({
      id: user.id,
      companyEmail: user.companyEmail ?? user.id,
    }),
  };
}

function serializeReservationParticipants(
  participants: ReservationWithRelations["participants"],
) {
  return participants?.map(({ user }) => serializeReservationPerson(user)) ?? [];
}

export function serializeTimelineReservation(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    colorKey: normalizeColorKey(reservation.colorKey),
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    purpose: reservation.purpose,
    user: reservation.user
      ? serializeReservationPerson(reservation.user)
      : undefined,
    participants: serializeReservationParticipants(reservation.participants),
    meetingRoom: reservation.meetingRoom
      ? {
          id: reservation.meetingRoom.id,
          name: reservation.meetingRoom.name,
        }
      : undefined,
  };
}

export function serializeReservationDetail(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    colorKey: normalizeColorKey(reservation.colorKey),
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    startTime: formatKstTime(reservation.startDatetime),
    endTime: formatKstTime(reservation.endDatetime),
    purpose: reservation.purpose,
    status: serializeReservationStatus(reservation.status),
    user: reservation.user
      ? serializeReservationPerson(reservation.user)
      : undefined,
    participants: serializeReservationParticipants(reservation.participants),
    meetingRoom: reservation.meetingRoom
      ? {
          id: reservation.meetingRoom.id,
          name: reservation.meetingRoom.name,
        }
      : undefined,
  };
}

export function serializeMyReservation(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    colorKey: normalizeColorKey(reservation.colorKey),
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    startTime: formatKstTime(reservation.startDatetime),
    endTime: formatKstTime(reservation.endDatetime),
    purpose: reservation.purpose,
    status: serializeReservationStatus(reservation.status),
    owner: reservation.user ? serializeReservationPerson(reservation.user) : undefined,
    participants: serializeReservationParticipants(reservation.participants),
    meetingRoom: reservation.meetingRoom
      ? {
          id: reservation.meetingRoom.id,
          name: reservation.meetingRoom.name,
        }
      : undefined,
  };
}

export function serializeMutationReservation(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    colorKey: normalizeColorKey(reservation.colorKey),
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    startTime: formatKstTime(reservation.startDatetime),
    endTime: formatKstTime(reservation.endDatetime),
    purpose: reservation.purpose,
    status: serializeReservationStatus(reservation.status),
    user: reservation.user
      ? serializeReservationPerson(reservation.user)
      : undefined,
    participants: serializeReservationParticipants(reservation.participants),
    meetingRoom: reservation.meetingRoom
      ? {
          id: reservation.meetingRoom.id,
          name: reservation.meetingRoom.name,
        }
      : undefined,
  };
}

export function serializeReservation(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startDatetime: reservation.startDatetime.toISOString(),
    endDatetime: reservation.endDatetime.toISOString(),
    purpose: reservation.purpose,
    status: serializeReservationStatus(reservation.status),
    user: reservation.user ? serializeReservationPerson(reservation.user) : undefined,
    participants: serializeReservationParticipants(reservation.participants),
    meetingRoom: reservation.meetingRoom,
  };
}
