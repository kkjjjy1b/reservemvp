import { NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { sanitizeUser } from "@/lib/auth/user";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

type UpdateProfileBody = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireCurrentSession();
    const body = (await request.json()) as UpdateProfileBody;
    const name = body.name?.trim();
    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword?.trim();

    if (!name) {
      return badRequest("이름을 입력해 주세요.");
    }

    const shouldChangePassword = Boolean(currentPassword || newPassword);

    if (shouldChangePassword) {
      if (!currentPassword || !newPassword) {
        return badRequest("비밀번호 변경 시 현재 비밀번호와 새 비밀번호를 입력해 주세요.");
      }

      if (currentPassword === newPassword) {
        return badRequest("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      }

      const isValidPassword = await verifyPassword(
        currentPassword,
        session.user.passwordHash,
      );

      if (!isValidPassword) {
        return unauthorized("현재 비밀번호가 올바르지 않습니다.");
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        ...(shouldChangePassword
          ? {
              passwordHash: await hashPassword(newPassword!),
              passwordChangedAt: new Date(),
            }
          : {}),
      },
    });

    const user = sanitizeUser(updatedUser);

    return NextResponse.json({
      user: {
        ...user,
        passwordChangedAt: user.passwordChangedAt
          ? user.passwordChangedAt.toISOString()
          : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("PATCH /api/me/profile failed", error);
    return serverError();
  }
}
