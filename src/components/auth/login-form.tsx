"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [companyEmail, setCompanyEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          companyEmail,
          password,
          rememberMe,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "로그인에 실패했습니다.");
        return;
      }

      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
          Company Email
        </span>
        <input
          type="email"
          required
          value={companyEmail}
          onChange={(event) => setCompanyEmail(event.target.value)}
          placeholder="name@company.com"
          className="mt-2.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20 focus:bg-white"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
          Password
        </span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호 입력"
          className="mt-2.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20 focus:bg-white"
        />
      </label>

      <label className="flex items-center gap-3 pt-1 text-sm text-[#787774]">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="h-4 w-4 rounded border border-black/15 text-[#2f3437]"
        />
        <span>다음부터 자동으로 로그인</span>
      </label>

      {errorMessage && (
        <div className="rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#2f3437] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
