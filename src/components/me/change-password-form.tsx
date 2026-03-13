"use client";

import { FormEvent, useState, useTransition } from "react";

type ChangePasswordFormProps = {
  onSuccess: (message: string) => void;
};

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("모든 비밀번호 입력값을 작성해 주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "비밀번호 변경에 실패했습니다.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess("비밀번호가 변경되었습니다.");
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
          Current Password
        </span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20"
          placeholder="현재 비밀번호"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
          New Password
        </span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20"
          placeholder="새 비밀번호"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
          Confirm Password
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20"
          placeholder="새 비밀번호 확인"
        />
      </label>

      {errorMessage && (
        <div className="rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
