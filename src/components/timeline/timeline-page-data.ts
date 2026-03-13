import { getCurrentSession } from "@/lib/auth/session";
import { getKstDateKey, isValidDateKey } from "@/lib/reservations/datetime";
import { getActiveMeetingRooms, getDailyReservations } from "@/lib/reservations/service";
import { buildTimelineResponse } from "@/lib/reservations/timeline";
import type { TimelineResponse } from "@/lib/reservations/types";

export async function getTimelinePageData(inputDate?: string): Promise<{
  selectedDate: string;
  userName: string | null;
  timeline: TimelineResponse | null;
}> {
  const selectedDate =
    inputDate && isValidDateKey(inputDate) ? inputDate : getKstDateKey(new Date());
  const session = await getCurrentSession();

  if (!session) {
    return {
      selectedDate,
      userName: null,
      timeline: null,
    };
  }

  const [rooms, reservations] = await Promise.all([
    getActiveMeetingRooms(),
    getDailyReservations(selectedDate),
  ]);

  return {
    selectedDate,
    userName: session.user.name,
    timeline: buildTimelineResponse({
      date: selectedDate,
      currentUserId: session.user.id,
      rooms,
      reservations,
    }),
  };
}
