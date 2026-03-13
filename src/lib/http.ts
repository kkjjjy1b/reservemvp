import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function unauthorized(message = "인증이 필요합니다.") {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = "권한이 없습니다.") {
  return NextResponse.json({ message }, { status: 403 });
}

export function serverError(message = "서버 오류가 발생했습니다.") {
  return NextResponse.json({ message }, { status: 500 });
}
