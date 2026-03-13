import type { TimelineReservation } from "@/lib/reservations/types";

const UNAVAILABLE_MESSAGE = "현재 예약이 불가능한 시간입니다.";

type AvailabilityParams = {
  reservationDate: string;
  startTime: string;
  endTime: string;
  reservations: TimelineReservation[];
  excludeReservationId?: string;
  now?: Date;
};

export function getUnavailableMessage() {
  return UNAVAILABLE_MESSAGE;
}

export function isSelectableStartSlot(
  reservationDate: string,
  startTime: string,
  now: Date = new Date(),
) {
  const todayKey = toKstDateKey(now);

  if (reservationDate < todayKey) {
    return false;
  }

  const startDatetime = buildUtcDatetime(reservationDate, startTime);
  return startDatetime.getTime() >= now.getTime();
}

export function getCreateAvailability({
  reservationDate,
  startTime,
  endTime,
  reservations,
  excludeReservationId,
  now = new Date(),
}: AvailabilityParams) {
  if (!isSelectableStartSlot(reservationDate, startTime, now)) {
    return {
      isAvailable: false,
      message: UNAVAILABLE_MESSAGE,
    };
  }

  const startDatetime = buildUtcDatetime(reservationDate, startTime);
  const endDatetime = buildUtcDatetime(reservationDate, endTime);

  if (endDatetime.getTime() <= startDatetime.getTime()) {
    return {
      isAvailable: false,
      message: UNAVAILABLE_MESSAGE,
    };
  }

  const conflict = reservations.some((reservation) => {
    if (excludeReservationId && reservation.id === excludeReservationId) {
      return false;
    }

    const reservationStart = new Date(reservation.startDatetime);
    const reservationEnd = new Date(reservation.endDatetime);

    return startDatetime < reservationEnd && endDatetime > reservationStart;
  });

  return {
    isAvailable: !conflict,
    message: conflict ? UNAVAILABLE_MESSAGE : null,
  };
}

function toKstDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildUtcDatetime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return new Date(utcTime);
}
