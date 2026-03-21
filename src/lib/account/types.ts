import type { ReservationColorKey } from "@/lib/reservations/colors";

export type ProfileIdentity = {
  id: string;
  name: string;
  companyEmail?: string;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
};

export type CurrentUserProfile = {
  id: string;
  companyEmail: string;
  name: string;
  isActive: boolean;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
};

export type MyReservationItem = {
  id: string;
  colorKey: ReservationColorKey;
  reservationDate: string;
  startDatetime: string;
  endDatetime: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: "active" | "cancelled";
  meetingRoom?: {
    name: string;
  };
  owner?: ProfileIdentity;
  participants?: ProfileIdentity[];
};
