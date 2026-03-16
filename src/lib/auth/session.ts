import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import {
  REMEMBERED_SESSION_DURATION_MS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants";

type SessionUser = {
  id: string;
  companyEmail: string;
  name: string;
  isActive: boolean;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SessionPayload = {
  sub: string;
  companyEmail: string;
  name: string;
  isActive: boolean;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  exp: number;
  rememberMe: boolean;
};

type CurrentSession = {
  user: SessionUser;
  expiresAt: Date;
  rememberMe: boolean;
};

export function getSessionExpiryDate(rememberMe = false) {
  return new Date(
    Date.now() + (rememberMe ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS),
  );
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || "reserv-mvp-dev-secret";
}

function serializePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function deserializePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
}

function signPayload(serializedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(serializedPayload).digest("base64url");
}

function createSignedToken(payload: SessionPayload) {
  const serializedPayload = serializePayload(payload);
  const signature = signPayload(serializedPayload);
  return `${serializedPayload}.${signature}`;
}

function verifySignedToken(token: string) {
  const [serializedPayload, signature] = token.split(".");

  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(serializedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return deserializePayload(serializedPayload);
  } catch {
    return null;
  }
}

function buildSessionPayload(user: SessionUser, expiresAt: Date, rememberMe: boolean): SessionPayload {
  return {
    sub: user.id,
    companyEmail: user.companyEmail,
    name: user.name,
    isActive: user.isActive,
    passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    exp: Math.floor(expiresAt.getTime() / 1000),
    rememberMe,
  };
}

function deserializeSessionUser(payload: SessionPayload): SessionUser {
  return {
    id: payload.sub,
    companyEmail: payload.companyEmail,
    name: payload.name,
    isActive: payload.isActive,
    passwordChangedAt: payload.passwordChangedAt ? new Date(payload.passwordChangedAt) : null,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}

export async function createSession(user: SessionUser, rememberMe = false) {
  const expiresAt = getSessionExpiryDate(rememberMe);
  const token = createSignedToken(buildSessionPayload(user, expiresAt, rememberMe));
  return { token, expiresAt };
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

  const payload = verifySignedToken(token);

  if (!payload) {
    return null;
  }

  const expiresAt = new Date(payload.exp * 1000);

  if (expiresAt <= new Date()) {
    return null;
  }

  if (!payload.isActive) {
    return null;
  }

  return {
    user: deserializeSessionUser(payload),
    expiresAt,
    rememberMe: payload.rememberMe,
  } satisfies CurrentSession;
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function deleteCurrentSession() {
  await clearSessionCookie();
}

export async function refreshSessionCookie(user: SessionUser, currentSession: CurrentSession) {
  const token = createSignedToken(
    buildSessionPayload(user, currentSession.expiresAt, currentSession.rememberMe),
  );
  await setSessionCookie(token, currentSession.expiresAt, currentSession.rememberMe);
}
