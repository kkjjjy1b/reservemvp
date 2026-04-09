export const MAX_WEEKDAY_RECURRING_OCCURRENCES = 30;

export function countWeekdaysInRange(startDate: string, endDate: string) {
  let count = 0;
  let cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.getUTCDay();

    if (day >= 1 && day <= 5) {
      count += 1;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

export function getWeekdayRecurringLimitMessage() {
  return `반복 예약은 최대 ${MAX_WEEKDAY_RECURRING_OCCURRENCES}회까지 생성할 수 있습니다.`;
}
