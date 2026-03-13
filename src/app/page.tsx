import { TimelinePage } from "@/components/timeline/timeline-page";
import { getTimelinePageData } from "@/components/timeline/timeline-page-data";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const { selectedDate, timeline, userName } = await getTimelinePageData(params?.date);

  return (
    <TimelinePage
      data={timeline}
      selectedDate={selectedDate}
      userName={userName}
    />
  );
}
