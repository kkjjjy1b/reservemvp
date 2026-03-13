"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "로그아웃에 실패했습니다.");
        return;
      }

      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className={
          className ??
          "rounded-lg border border-black/10 bg-white px-3.5 py-2 text-sm text-[#37352f] transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </button>

      {errorMessage && (
        <p className="text-xs text-rust">{errorMessage}</p>
      )}
    </div>
  );
}
