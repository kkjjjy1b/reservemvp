import {
  AvatarStack as SharedAvatarStack,
  type AvatarStackItem,
} from "@/components/ui/avatar-stack";
import type { ReservationPerson } from "@/lib/reservations/types";

type AvatarStackProps = {
  owner?: ReservationPerson | null;
  participants?: ReservationPerson[];
  maxVisible?: number;
  size?: "sm" | "md";
};

export function AvatarStack({
  owner = null,
  participants = [],
  maxVisible = 4,
  size = "sm",
}: AvatarStackProps) {
  const items: AvatarStackItem[] = [owner, ...participants]
    .filter((person): person is ReservationPerson => Boolean(person?.name))
    .map((person, index) => ({
      id: person.id ?? `${person.name}-${index}`,
      name: person.name,
      avatarUrl: person.avatarUrl,
      avatarSeed: person.avatarSeed ?? person.id ?? person.companyEmail ?? person.name,
      description: index === 0 && owner ? "예약자" : "참여자",
    }));

  return <SharedAvatarStack items={items} maxVisible={maxVisible} size={size} emptyLabel="" />;
}
