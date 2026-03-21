"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, type AvatarIdentity } from "@/components/ui/avatar";

export type ParticipantOption = AvatarIdentity & {
  id: string;
  email?: string | null;
  teamName?: string | null;
  description?: string | null;
};

type ParticipantInputProps = {
  label?: string;
  placeholder?: string;
  query: string;
  selected: ParticipantOption[];
  options: ParticipantOption[];
  onQueryChange: (query: string) => void;
  onSelect: (option: ParticipantOption) => void;
  onRemove: (id: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  maxSelections?: number;
  helperText?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
};

export function ParticipantInput({
  label = "참여자",
  placeholder = "이름 또는 이메일로 검색",
  query,
  selected,
  options,
  onQueryChange,
  onSelect,
  onRemove,
  onClear,
  isLoading = false,
  disabled = false,
  maxSelections,
  helperText = "현재 팀의 활성 사용자만 검색됩니다.",
  emptyMessage = "검색 결과가 없습니다.",
  loadingMessage = "검색 중...",
  className = "",
}: ParticipantInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = useMemo(() => {
    const selectedIds = new Set(selected.map((item) => item.id));
    return options.filter((option) => !selectedIds.has(option.id));
  }, [options, selected]);

  const canAddMore = maxSelections ? selected.length < maxSelections : true;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!inputRef.current?.closest("[data-participant-input]")) {
        return;
      }

      const root = inputRef.current.closest("[data-participant-input]");
      if (root && !root.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <section
      data-participant-input
      className={`rounded-2xl border border-black/10 bg-white p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6b6a67]">{helperText}</p>
        </div>
        {onClear && selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-[#6b6a67] transition hover:bg-black/[0.03]"
          >
            전체 해제
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => onRemove(participant.id)}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbfbfa] px-2 py-1.5 text-left text-sm text-[#37352f] transition hover:bg-black/[0.03]"
              >
                <Avatar
                  name={participant.name}
                  avatarUrl={participant.avatarUrl}
                  avatarSeed={participant.avatarSeed ?? participant.id}
                  size="xs"
                />
                <span className="max-w-[160px] truncate">{participant.name}</span>
                <span className="text-[#9b9a97]">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fbfbfa] px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(event) => {
                onQueryChange(event.target.value);
                setIsOpen(true);
              }}
              disabled={disabled || !canAddMore}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#9b9a97] disabled:cursor-not-allowed"
              aria-autocomplete="list"
              aria-expanded={isOpen}
            />
            {isLoading && <span className="text-xs text-[#9b9a97]">{loadingMessage}</span>}
          </div>

          {isOpen && !disabled && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.1)]">
              {filteredOptions.length > 0 ? (
                <div className="max-h-72 overflow-y-auto p-2">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onSelect(option);
                        onQueryChange("");
                        setIsOpen(true);
                        inputRef.current?.focus();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-black/[0.03]"
                    >
                      <Avatar
                        name={option.name}
                        avatarUrl={option.avatarUrl}
                        avatarSeed={option.avatarSeed ?? option.id}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-[#37352f]">
                            {option.name}
                          </span>
                          {option.teamName && (
                            <span className="rounded-full bg-[#f4f2ee] px-2 py-0.5 text-[11px] text-[#787774]">
                              {option.teamName}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#9b9a97]">
                          {option.email && <span>{option.email}</span>}
                          {option.description && <span>{option.description}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-[#9b9a97]">
                  {isLoading ? loadingMessage : emptyMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
