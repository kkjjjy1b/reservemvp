import {
  RESERVATION_TIME_ZONE,
  SLOT_MINUTES,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "@/lib/reservations/constants";

function formatParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESERVATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
    second: Number(parts.find((part) => part.type === "second")?.value),
  };
}

export function getKstDateKey(date: Date) {
  const { year, month, day } = formatParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatKstTime(date: Date) {
  const { hour, minute } = formatParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidHalfHourBoundary(date: Date) {
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % SLOT_MINUTES === 0
  );
}

export function getMinutesOfDayInKst(date: Date) {
  const { hour, minute } = formatParts(date);
  return hour * 60 + minute;
}

export function getTimelineSlotIndex(date: Date) {
  const startMinutes = TIMELINE_START_HOUR * 60;
  return (getMinutesOfDayInKst(date) - startMinutes) / SLOT_MINUTES;
}

export function getTimelineSlotCount() {
  return ((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60) / SLOT_MINUTES;
}

export function isWithinTimeline(date: Date) {
  const minutes = getMinutesOfDayInKst(date);
  const startMinutes = TIMELINE_START_HOUR * 60;
  const endMinutes = TIMELINE_END_HOUR * 60;

  return minutes >= startMinutes && minutes <= endMinutes;
}

export function isPastDateKey(dateKey: string) {
  const today = getKstDateKey(new Date());
  return dateKey < today;
}

export function isBeforeNowInKst(date: Date) {
  return date.getTime() < Date.now();
}

export function isStartBeforeEnd(startDatetime: Date, endDatetime: Date) {
  return endDatetime.getTime() > startDatetime.getTime();
}

export function isAtLeastThirtyMinutes(startDatetime: Date, endDatetime: Date) {
  return endDatetime.getTime() - startDatetime.getTime() >= SLOT_MINUTES * 60 * 1000;
}
