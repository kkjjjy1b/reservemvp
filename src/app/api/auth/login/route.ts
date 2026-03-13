import { NextRequest, NextResponse } from "next/server";

import { createSession, setSessionCookie } from "@/lib/auth/session";
import { findActiveUserByEmail, sanitizeUser } from "@/lib/auth/user";
import { verifyPassword } from "@/lib/auth/password";
import { badRequest, unauthorized, serverError } from "@/lib/http";

type LoginBody = {
  companyEmail?: string;
  password?: string;
  rememberMe?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const companyEmail = body.companyEmail?.trim().toLowerCase();
    const password = body.password?.trim();
    const rememberMe = body.rememberMe === true;

    if (!companyEmail || !password) {
      return badRequest("회사 이메일과 비밀번호를 입력해 주세요.");
    }

    const user = await findActiveUserByEmail(companyEmail);

    if (!user) {
      return unauthorized("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return unauthorized("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const { token, expiresAt } = await createSession(user.id, rememberMe);
    await setSessionCookie(token, expiresAt, rememberMe);

    return NextResponse.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return serverError();
  }
}
