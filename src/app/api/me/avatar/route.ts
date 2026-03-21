import { NextRequest, NextResponse } from "next/server";

import { refreshSessionCookie, requireCurrentSession } from "@/lib/auth/session";
import { findActiveSessionUserById, sanitizeUser } from "@/lib/auth/user";
import {
  deleteAvatarFile,
  isAvatarStorageConfigured,
  uploadAvatarFile,
  validateAvatarFile,
} from "@/lib/account/avatar-storage";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "icn1";

function serializeProfileUser(user: ReturnType<typeof sanitizeUser>) {
  return {
    ...user,
    passwordChangedAt: user.passwordChangedAt
      ? user.passwordChangedAt.toISOString()
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireCurrentSession();

    if (!isAvatarStorageConfigured()) {
      return NextResponse.json(
        { message: "프로필 이미지 저장소가 아직 설정되지 않았습니다." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File)) {
      return badRequest("업로드할 이미지 파일이 필요합니다.");
    }

    const validationError = validateAvatarFile(avatar);

    if (validationError) {
      return badRequest(validationError);
    }

    const currentUser = await findActiveSessionUserById(session.user.id);

    if (!currentUser) {
      return unauthorized();
    }

    const uploaded = await uploadAvatarFile({
      userId: session.user.id,
      file: avatar,
    });

    try {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          avatarUrl: uploaded.url,
          avatarStorageKey: uploaded.pathname,
        },
      });
    } catch (error) {
      await deleteAvatarFile(uploaded.pathname);
      throw error;
    }

    if (currentUser.avatarStorageKey && currentUser.avatarStorageKey !== uploaded.pathname) {
      await deleteAvatarFile(currentUser.avatarStorageKey).catch((error) => {
        console.error("Failed to delete previous avatar blob", error);
      });
    }

    const updatedUser = await findActiveSessionUserById(session.user.id);

    if (!updatedUser) {
      return unauthorized();
    }

    const user = sanitizeUser(updatedUser);
    await refreshSessionCookie(updatedUser, session);

    return NextResponse.json({
      user: serializeProfileUser(user),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("POST /api/me/avatar failed", error);
    return serverError();
  }
}

export async function DELETE() {
  try {
    const session = await requireCurrentSession();
    const currentUser = await findActiveSessionUserById(session.user.id);

    if (!currentUser) {
      return unauthorized();
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        avatarUrl: null,
        avatarStorageKey: null,
      },
    });

    if (isAvatarStorageConfigured() && currentUser.avatarStorageKey) {
      await deleteAvatarFile(currentUser.avatarStorageKey).catch((error) => {
        console.error("Failed to delete avatar blob", error);
      });
    }

    const updatedUser = await findActiveSessionUserById(session.user.id);

    if (!updatedUser) {
      return unauthorized();
    }

    const user = sanitizeUser(updatedUser);
    await refreshSessionCookie(updatedUser, session);

    return NextResponse.json({
      user: serializeProfileUser(user),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("DELETE /api/me/avatar failed", error);
    return serverError();
  }
}
