import { prisma } from "@/lib/prisma";

export async function findActiveUserByEmail(companyEmail: string) {
  return prisma.user.findFirst({
    where: {
      companyEmail,
      isActive: true,
    },
  });
}

export function sanitizeUser(user: {
  id: string;
  companyEmail: string;
  name: string;
  isActive: boolean;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    companyEmail: user.companyEmail,
    name: user.name,
    isActive: user.isActive,
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
