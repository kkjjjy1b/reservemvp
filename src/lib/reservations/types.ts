import type { ReservationColorKey } from "@/lib/reservations/colors";

export type TimelineResponse = {
  date: string;
  timeline: {
    startTime: "06:00";
    endTime: "24:00";
    slotMinutes: 30;
    slotCount: 36;
  };
  rooms: TimelineRoom[];
};

export type TimelineRoom = {
  id: string;
  name: string;
  capacity: number | null;
  location: string | null;
  description: string | null;
  reservations: TimelineReservation[];
};

export type TimelineReservation = {
  id: string;
  title: string | null;
  colorKey: ReservationColorKey;
  startDatetime: string;
  endDatetime: string;
  startTime: string;
  endTime: string;
  startSlotIndex: number;
  endSlotIndex: number;
  slotSpan: number;
  user: {
    name: string;
  };
  isMine: boolean;
  status: "active";
};

export type EmptySlotSelection = {
  date: string;
  roomId: string;
  roomName: string;
  slotIndex: number;
  startTime: string;
  startDatetime: string;
};

export type ReservationDetail = {
  id: string;
  colorKey: ReservationColorKey;
  reservationDate: string;
  startDatetime: string;
  endDatetime: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: "active" | "cancelled";
  user?: {
    name: string;
  };
  meetingRoom?: {
    id: string;
    name: string;
  };
};

export type ReservationDetailResponse = {
  reservation: ReservationDetail;
  canEdit: boolean;
  canCancel: boolean;
  isMine: boolean;
};
