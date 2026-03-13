import {
  getKstDateKey,
  getMinutesOfDayInKst,
  isAtLeastThirtyMinutes,
  isBeforeNowInKst,
  isPastDateKey,
  isStartBeforeEnd,
  isValidDateKey,
  isValidHalfHourBoundary,
} from "@/lib/reservations/datetime";
import { TIMELINE_END_HOUR, TIMELINE_START_HOUR } from "@/lib/reservations/constants";

type ReservationInput = {
  reservationDate: string;
  startDatetime: Date;
  endDatetime: Date;
};

export function validateReservationInput(input: ReservationInput) {
  const endDatetimeInclusive = new Date(input.endDatetime.getTime() - 1000);
  const timelineStartMinutes = TIMELINE_START_HOUR * 60;
  const timelineEndMinutes = TIMELINE_END_HOUR * 60;

  if (!isValidDateKey(input.reservationDate)) {
    return "예약 날짜 형식이 올바르지 않습니다.";
  }

  if (Number.isNaN(input.startDatetime.getTime()) || Number.isNaN(input.endDatetime.getTime())) {
    return "예약 시간 형식이 올바르지 않습니다.";
  }

  if (getKstDateKey(input.startDatetime) !== input.reservationDate) {
    return "예약 날짜와 시작 시간이 일치하지 않습니다.";
  }

  if (getKstDateKey(endDatetimeInclusive) !== input.reservationDate) {
    return "종료 시간은 같은 날짜 안에 있어야 합니다.";
  }

  if (isPastDateKey(input.reservationDate)) {
    return "과거 날짜는 예약할 수 없습니다.";
  }

  if (!isValidHalfHourBoundary(input.startDatetime) || !isValidHalfHourBoundary(input.endDatetime)) {
    return "시작 시간과 종료 시간은 30분 단위여야 합니다.";
  }

  if (!isStartBeforeEnd(input.startDatetime, input.endDatetime)) {
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  }

  if (!isAtLeastThirtyMinutes(input.startDatetime, input.endDatetime)) {
    return "최소 예약 시간은 30분입니다.";
  }

  const startMinutes = getMinutesOfDayInKst(input.startDatetime);
  const endMinutesInclusive = getMinutesOfDayInKst(endDatetimeInclusive);

  if (
    startMinutes < timelineStartMinutes ||
    startMinutes >= timelineEndMinutes ||
    endMinutesInclusive < timelineStartMinutes ||
    endMinutesInclusive >= timelineEndMinutes
  ) {
    return "예약 가능 시간은 06:00부터 24:00까지입니다.";
  }

  return null;
}

export function validateReservationCreateWindow(input: ReservationInput) {
  const commonError = validateReservationInput(input);

  if (commonError) {
    return commonError;
  }

  if (isBeforeNowInKst(input.startDatetime)) {
    return "현재 시각 이전 시작 시간으로는 예약할 수 없습니다.";
  }

  return null;
}

export function validateReservationUpdateWindow(input: ReservationInput) {
  const commonError = validateReservationInput(input);

  if (commonError) {
    return commonError;
  }

  if (isBeforeNowInKst(input.startDatetime)) {
    return "현재 시각 이전 시작 시간으로는 수정할 수 없습니다.";
  }

  return null;
}

export function canEditReservation(startDatetime: Date) {
  return startDatetime.getTime() > Date.now();
}
