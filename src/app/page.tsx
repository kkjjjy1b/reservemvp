import { redirect } from "next/navigation";

import { TimelinePage } from "@/components/timeline/timeline-page";
import { getCurrentSession } from "@/lib/auth/session";
import { getKstDateKey, isValidDateKey } from "@/lib/reservations/datetime";
import {
  getActiveMeetingRooms,
  getDailyReservations,
} from "@/lib/reservations/service";
import { buildTimelineResponse } from "@/lib/reservations/timeline";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export const preferredRegion = "sin1";

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedDate =
    params?.date && isValidDateKey(params.date) ? params.date : getKstDateKey(new Date());
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [rooms, reservations] = await Promise.all([
    getActiveMeetingRooms(),
    getDailyReservations(selectedDate),
  ]);

  const initialTimelineData = buildTimelineResponse({
    date: selectedDate,
    currentUserId: session.user.id,
    rooms,
    reservations,
  });

  return (
    <TimelinePage
      selectedDate={selectedDate}
      userId={session.user.id}
      userName={session.user.name}
      initialTimelineData={initialTimelineData}
      isAuthenticated
    />
  );
}
