import { prisma } from "@/lib/prisma";

type AuthSessionTeam = {
  id: string;
  name: string;
} | null;

export type AuthSessionUser = {
  id: string;
  companyEmail: string;
  name: string;
  isActive: boolean;
  avatarUrl?: string | null;
  avatarStorageKey?: string | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  team?: AuthSessionTeam;
};

export async function findActiveUserByEmail(companyEmail: string) {
  return prisma.user.findFirst({
    where: {
      companyEmail,
      isActive: true,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function findActiveSessionUserById(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      isActive: true,
    },
    select: {
      id: true,
      companyEmail: true,
      name: true,
      isActive: true,
      avatarUrl: true,
      avatarStorageKey: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export function getAvatarSeed(user: Pick<AuthSessionUser, "id" | "companyEmail">) {
  return user.companyEmail || user.id;
}

export function sanitizeUser(user: AuthSessionUser) {
  return {
    id: user.id,
    companyEmail: user.companyEmail,
    name: user.name,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl ?? null,
    avatarStorageKey: user.avatarStorageKey ?? null,
    avatarSeed: getAvatarSeed(user),
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    team: user.team ?? null,
  };
}
