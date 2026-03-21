import { ReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function ensureActiveMeetingRoom(meetingRoomId: string) {
  return prisma.meetingRoom.findFirst({
    where: {
      id: meetingRoomId,
      isActive: true,
    },
  });
}

export async function findReservationConflict(params: {
  meetingRoomId: string;
  startDatetime: Date;
  endDatetime: Date;
  excludeReservationId?: string;
}) {
  return prisma.reservation.findFirst({
    where: {
      meetingRoomId: params.meetingRoomId,
      status: ReservationStatus.active,
      id: params.excludeReservationId
        ? {
            not: params.excludeReservationId,
          }
        : undefined,
      startDatetime: {
        lt: params.endDatetime,
      },
      endDatetime: {
        gt: params.startDatetime,
      },
    },
    select: {
      id: true,
      startDatetime: true,
      endDatetime: true,
    },
  });
}

export async function getDailyReservations(reservationDate: string) {
  return prisma.reservation.findMany({
    where: {
      reservationDate: new Date(`${reservationDate}T00:00:00.000Z`),
      status: ReservationStatus.active,
      meetingRoom: {
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyEmail: true,
          avatarUrl: true,
        },
      },
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              companyEmail: true,
              avatarUrl: true,
            },
          },
        },
      },
      meetingRoom: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        meetingRoom: {
          sortOrder: "asc",
        },
      },
      {
        startDatetime: "asc",
      },
    ],
  });
}

export async function getActiveMeetingRooms() {
  return prisma.meetingRoom.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      location: true,
      description: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyEmail: true,
          avatarUrl: true,
        },
      },
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              companyEmail: true,
              avatarUrl: true,
            },
          },
        },
      },
      meetingRoom: true,
    },
  });
}

export async function getMyReservations(userId: string) {
  return prisma.reservation.findMany({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyEmail: true,
          avatarUrl: true,
        },
      },
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              companyEmail: true,
              avatarUrl: true,
            },
          },
        },
      },
      meetingRoom: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        reservationDate: "desc",
      },
      {
        startDatetime: "desc",
      },
    ],
  });
}
