import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth/session";

export const preferredRegion = "icn1";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 md:px-6">
      <div className="w-full max-w-5xl">
        <section className="grid overflow-hidden rounded-2xl border border-black/10 bg-[#ffffffd9] shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-black/10 bg-[#fbfbfa] px-8 py-12 md:px-10 lg:border-b-0 lg:border-r lg:px-12">
            <div className="max-w-[430px]">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#787774]">
                  청림 인베스트
                </p>
                <p className="text-[13px] text-right text-[#9b9a97]">
                  회의실 예약 서비스
                </p>
              </div>
              <h1 className="mt-8 text-[44px] font-semibold tracking-tight text-[#2f3437]">
                회사 이메일로
                <br />
                로그인하세요
              </h1>
              <p className="mt-8 max-w-[410px] text-base leading-8 text-[#6b6a67]">
                회사 이메일과 사전 제공된 비밀번호로 로그인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="px-8 py-12 md:px-10 lg:px-12">
            <div className="max-w-[430px]">
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#787774]">
                Sign In
              </p>
              <div className="mt-8">
                <LoginForm />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex justify-end">
          <p className="w-full max-w-[430px] text-right text-xs text-[#9b9a97]">
            Copyright 2026. Jayden. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
