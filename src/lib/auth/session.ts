import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";

import {
  REMEMBERED_SESSION_DURATION_MS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiryDate(rememberMe = false) {
  return new Date(
    Date.now() + (rememberMe ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS),
  );
}

export async function createSession(userId: string, rememberMe = false) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate(rememberMe);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { session, token, expiresAt };
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
  rememberMe = false,
) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: rememberMe ? expiresAt : undefined,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

export async function readSessionTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentSession() {
  const token = await readSessionTokenFromCookie();

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    await clearSessionCookie();
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session;
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function deleteCurrentSession() {
  const token = await readSessionTokenFromCookie();

  if (!token) {
    await clearSessionCookie();
    return;
  }

  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: { tokenHash },
  });

  await clearSessionCookie();
}
