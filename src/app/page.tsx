import { redirect } from "next/navigation";

import { TimelinePage } from "@/components/timeline/timeline-page";
import { getCurrentSession } from "@/lib/auth/session";
import { getKstDateKey, isValidDateKey } from "@/lib/reservations/datetime";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export const preferredRegion = "icn1";

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedDate =
    params?.date && isValidDateKey(params.date) ? params.date : getKstDateKey(new Date());
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <TimelinePage
      selectedDate={selectedDate}
      userId={session.user.id}
      userName={session.user.name}
      isAuthenticated
    />
  );
}
