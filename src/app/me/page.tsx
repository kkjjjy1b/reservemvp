import { redirect } from "next/navigation";

import { AccountPage } from "@/components/me/account-page";
import type { CurrentUserProfile } from "@/lib/account/types";
import { getCurrentSession } from "@/lib/auth/session";
import { sanitizeUser } from "@/lib/auth/user";
import { getMyReservations } from "@/lib/reservations/service";
import { serializeMyReservation } from "@/lib/reservations/serialize";

export const preferredRegion = "icn1";

export default async function MyPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const reservations = await getMyReservations(session.user.id);
  const user = sanitizeUser(session.user);

  const profile: CurrentUserProfile = {
    ...user,
    passwordChangedAt: user.passwordChangedAt
      ? user.passwordChangedAt.toISOString()
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return (
    <AccountPage
      user={profile}
      initialReservations={reservations.map(serializeMyReservation)}
    />
  );
}
