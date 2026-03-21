import { prisma } from "@/lib/prisma";

export async function findDefaultTeam() {
  return prisma.team.findFirst({
    where: {
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function searchActiveUsersInTeam(params: {
  teamId: string;
  query: string;
  excludeUserId?: string;
  limit?: number;
}) {
  const normalizedQuery = params.query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      teamId: params.teamId,
      isActive: true,
      id: params.excludeUserId
        ? {
            not: params.excludeUserId,
          }
        : undefined,
      OR: [
        {
          name: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
        {
          companyEmail: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      companyEmail: true,
      avatarUrl: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ name: "asc" }, { companyEmail: "asc" }],
    take: params.limit ?? 8,
  });
}

export async function findActiveUsersInTeamByIds(params: {
  teamId: string;
  userIds: string[];
  excludeUserId?: string;
}) {
  if (params.userIds.length === 0) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      id: {
        in: params.userIds,
        ...(params.excludeUserId ? { not: params.excludeUserId } : {}),
      },
      teamId: params.teamId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      companyEmail: true,
      avatarUrl: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
