import { TimelinePage } from "@/components/timeline/timeline-page";
import { getCurrentSession } from "@/lib/auth/session";
import { getKstDateKey, isValidDateKey } from "@/lib/reservations/datetime";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedDate =
    params?.date && isValidDateKey(params.date) ? params.date : getKstDateKey(new Date());
  const session = await getCurrentSession();

  return (
    <TimelinePage
      selectedDate={selectedDate}
      userName={session?.user.name ?? null}
      isAuthenticated={Boolean(session)}
    />
  );
}
