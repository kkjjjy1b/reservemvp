import { NextRequest, NextResponse } from "next/server";

import { refreshSessionCookie, requireCurrentSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { sanitizeUser } from "@/lib/auth/user";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export const preferredRegion = "icn1";

export async function POST(request: NextRequest) {
  try {
    const session = await requireCurrentSession();
    const body = (await request.json()) as ChangePasswordBody;
    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword?.trim();
    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        isActive: true,
      },
    });

    if (!currentUser) {
      return unauthorized();
    }

    if (!currentPassword || !newPassword) {
      return badRequest("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
    }

    if (currentPassword === newPassword) {
      return badRequest("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
    }

    const isValidPassword = await verifyPassword(
      currentPassword,
      currentUser.passwordHash,
    );

    if (!isValidPassword) {
      return unauthorized("현재 비밀번호가 올바르지 않습니다.");
    }

    const passwordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    await refreshSessionCookie(sanitizeUser(updatedUser), session);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("POST /api/auth/change-password failed", error);
    return serverError();
  }
}
