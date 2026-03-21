"use client";

import { type ChangeEvent, useRef } from "react";

import { Avatar } from "@/components/ui/avatar";

type ProfileImageFieldProps = {
  label?: string;
  name: string;
  currentImageUrl?: string | null;
  helperText?: string;
  onFileSelect?: (file: File | null) => void;
  onClear?: () => void;
  disabled?: boolean;
  accept?: string;
  className?: string;
};

export function ProfileImageField({
  label = "프로필 이미지",
  name,
  currentImageUrl,
  helperText = "기본 이미지는 자동 생성되며, 이미지를 업로드하면 프로필에 반영할 수 있습니다.",
  onFileSelect,
  onClear,
  disabled = false,
  accept = "image/*",
  className = "",
}: ProfileImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect?.(file);
    event.target.value = "";
  }

  return (
    <section className={`rounded-2xl border border-black/10 bg-[#fbfbfa] p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6b6a67]">{helperText}</p>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={name} avatarUrl={currentImageUrl} avatarSeed={name} size="xl" />
          <div className="space-y-2">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#37352f] transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentImageUrl ? "이미지 변경" : "이미지 업로드"}
            </button>
            {currentImageUrl && onClear && (
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="block rounded-lg px-3 py-1.5 text-left text-xs text-[#9b9a97] transition hover:text-[#6b6a67] disabled:cursor-not-allowed disabled:opacity-60"
              >
                기본 이미지로 변경
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />
    </section>
  );
}
