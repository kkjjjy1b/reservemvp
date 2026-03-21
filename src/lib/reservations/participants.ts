import { NextResponse } from "next/server";

import { badRequest } from "@/lib/http";
import { findActiveUsersInTeamByIds } from "@/lib/users/service";

export function normalizeParticipantUserIds(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  const uniqueIds = new Set<string>();

  for (const value of input) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    uniqueIds.add(normalized);
  }

  return Array.from(uniqueIds);
}

export async function resolveParticipantUsers(params: {
  teamId: string | null | undefined;
  ownerUserId: string;
  participantUserIds: string[];
}): Promise<
  | {
      users: Awaited<ReturnType<typeof findActiveUsersInTeamByIds>>;
      error: null;
    }
  | {
      users: [];
      error: NextResponse;
    }
> {
  if (params.participantUserIds.length === 0) {
    return {
      users: [],
      error: null,
    };
  }

  if (!params.teamId) {
    return {
      users: [],
      error: badRequest("참여자를 조회할 기본 팀 정보가 없습니다."),
    };
  }

  const users = await findActiveUsersInTeamByIds({
    teamId: params.teamId,
    userIds: params.participantUserIds,
    excludeUserId: params.ownerUserId,
  });

  if (users.length !== params.participantUserIds.length) {
    return {
      users: [],
      error: badRequest("참여자는 같은 팀의 활성 사용자만 선택할 수 있습니다."),
    };
  }

  return {
    users,
    error: null,
  };
}
