import { NextRequest, NextResponse } from "next/server";

import { requireCurrentSession } from "@/lib/auth/session";
import { getAvatarSeed } from "@/lib/auth/user";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { searchActiveUsersInTeam } from "@/lib/users/service";

export const preferredRegion = "icn1";

export async function GET(request: NextRequest) {
  try {
    const session = await requireCurrentSession();
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    if (!session.user.team?.id) {
      return badRequest("검색 가능한 팀 정보가 없습니다.");
    }

    const users = await searchActiveUsersInTeam({
      teamId: session.user.team.id,
      query,
      excludeUserId: session.user.id,
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        companyEmail: user.companyEmail,
        avatarUrl: user.avatarUrl ?? null,
        avatarSeed: getAvatarSeed({
          id: user.id,
          companyEmail: user.companyEmail,
        }),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }

    console.error("GET /api/users/search failed", error);
    return serverError();
  }
}
