"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ParticipantInput,
  type ParticipantOption,
} from "@/components/ui/participant-input";
import type { ReservationPerson, UserSearchResponse } from "@/lib/reservations/types";

type ParticipantSelectorProps = {
  selectedParticipants: ReservationPerson[];
  ownerId?: string | null;
  disabled?: boolean;
  onChange: (participants: ReservationPerson[]) => void;
};

export function ParticipantSelector({
  selectedParticipants,
  ownerId = null,
  disabled = false,
  onChange,
}: ParticipantSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReservationPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedIds = useMemo(
    () =>
      new Set(
        selectedParticipants
          .map((participant) => participant.id)
          .filter((participantId): participantId is string => Boolean(participantId)),
      ),
    [selectedParticipants],
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || disabled) {
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(trimmedQuery)}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as
          | UserSearchResponse
          | { message?: string };

        if (!response.ok) {
          if (!cancelled) {
            setResults([]);
            setErrorMessage(
              (payload as { message?: string }).message ?? "참여자 검색에 실패했습니다.",
            );
          }
          return;
        }

        if (!cancelled) {
          setResults((payload as UserSearchResponse).users ?? []);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
          setErrorMessage("참여자 검색에 실패했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [disabled, query]);

  function addParticipant(participant: ReservationPerson) {
    if (!participant.id || selectedIds.has(participant.id) || participant.id === ownerId) {
      return;
    }

    onChange([...selectedParticipants, participant]);
    setQuery("");
    setResults([]);
  }

  function removeParticipant(participantId?: string) {
    if (!participantId) {
      return;
    }

    onChange(selectedParticipants.filter((participant) => participant.id !== participantId));
  }

  const selectedOptions: ParticipantOption[] = selectedParticipants
    .filter((participant): participant is ReservationPerson & { id: string } => Boolean(participant.id))
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      avatarUrl: participant.avatarUrl,
      avatarSeed: participant.avatarSeed ?? participant.id ?? participant.companyEmail ?? participant.name,
      email: participant.companyEmail,
    }));

  const participantOptions: ParticipantOption[] = results
    .filter((participant) => participant.id !== ownerId)
    .filter((participant) => !participant.id || !selectedIds.has(participant.id))
    .map((participant) => ({
      id: participant.id ?? participant.name,
      name: participant.name,
      avatarUrl: participant.avatarUrl,
      avatarSeed: participant.avatarSeed ?? participant.id ?? participant.companyEmail ?? participant.name,
      email: participant.companyEmail,
    }));

  return (
    <ParticipantInput
      query={query}
      selected={selectedOptions}
      options={participantOptions}
      onQueryChange={setQuery}
      onSelect={(participant) =>
        addParticipant({
          id: participant.id,
          name: participant.name,
          companyEmail: participant.email ?? undefined,
          avatarUrl: participant.avatarUrl ?? null,
          avatarSeed: participant.avatarSeed ?? participant.id,
        })
      }
      onRemove={removeParticipant}
      onClear={() => onChange([])}
      isLoading={isLoading}
      disabled={disabled}
      helperText="현재 팀의 활성 사용자를 검색해 참여자로 추가합니다."
      emptyMessage={errorMessage ?? "검색 결과가 없습니다."}
      loadingMessage="검색 중..."
    />
  );
}
