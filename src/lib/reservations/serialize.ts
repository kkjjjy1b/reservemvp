import { Reservation, ReservationStatus } from "@prisma/client";

import { isReservationColorKey } from "@/lib/reservations/colors";
import { formatKstTime } from "@/lib/reservations/datetime";

export function serializeReservationStatus(status: ReservationStatus) {
  return status;
}

type ReservationWithRelations = Reservation & {
  user?: { id: string; name: string };
  meetingRoom?: { id: string; name: string };
};

function normalizeColorKey(colorKey: string) {
  return isReservationColorKey(colorKey) ? colorKey : "sky";
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
      ? {
          name: reservation.user.name,
        }
      : undefined,
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
      ? {
          name: reservation.user.name,
        }
      : undefined,
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
      ? {
          name: reservation.user.name,
        }
      : undefined,
    meetingRoom: reservation.meetingRoom
      ? {
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
    user: reservation.user,
    meetingRoom: reservation.meetingRoom,
  };
}
