"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  getCreateAvailability,
  getUnavailableMessage,
} from "@/lib/reservations/client-policy";
import {
  getRandomReservationColorKey,
  getReservationColorTheme,
  type ReservationColorKey,
} from "@/lib/reservations/colors";
import type {
  EmptySlotSelection,
  MutationReservation,
  TimelineReservation,
} from "@/lib/reservations/types";

type ReservationCreateModalProps = {
  selection: EmptySlotSelection | null;
  roomReservations: TimelineReservation[];
  onClose: () => void;
  onCreated: (message: string, reservation: MutationReservation) => void;
};

type ReservationCreateForm = {
  endTime: string;
  purpose: string;
};

const TIME_OPTIONS = buildTimeOptions();
const UNAVAILABLE_MESSAGE = getUnavailableMessage();

export function ReservationCreateModal({
  selection,
  roomReservations,
  onClose,
  onCreated,
}: ReservationCreateModalProps) {
  const [colorKey, setColorKey] = useState<ReservationColorKey>(getRandomReservationColorKey);
  const [form, setForm] = useState<ReservationCreateForm>(() => ({
    endTime: getNextTimeOption(selection?.startTime ?? "06:00"),
    purpose: "",
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selection) {
      return;
    }

    setForm({
      endTime: getNextTimeOption(selection.startTime),
      purpose: "",
    });
    setColorKey(getRandomReservationColorKey());
    setErrorMessage(null);
  }, [selection]);

  const availability = useMemo(() => {
    if (!selection) {
      return {
        isAvailable: false,
        message: UNAVAILABLE_MESSAGE,
      };
    }

    return getCreateAvailability({
      reservationDate: selection.date,
      startTime: selection.startTime,
      endTime: form.endTime,
      reservations: roomReservations,
    });
  }, [form.endTime, roomReservations, selection]);

  if (!selection) {
    return null;
  }

  const currentSelection = selection;
  const colorTheme = getReservationColorTheme(colorKey);

  const endTimeOptions = TIME_OPTIONS.filter(
    (time) => toMinutes(time) > toMinutes(currentSelection.startTime),
  );

  async function handleSubmit() {
    setErrorMessage(null);

    if (!availability.isAvailable) {
      setErrorMessage(UNAVAILABLE_MESSAGE);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          meetingRoomId: currentSelection.roomId,
          reservationDate: currentSelection.date,
          startDatetime: currentSelection.startDatetime,
          endDatetime: buildUtcDatetime(currentSelection.date, form.endTime),
          colorKey,
          purpose: form.purpose.trim(),
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        reservation?: MutationReservation;
      };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "예약 생성에 실패했습니다.");
        return;
      }

      if (!payload.reservation) {
        setErrorMessage("예약 생성 결과를 확인할 수 없습니다.");
        return;
      }

      onCreated("예약이 생성되었습니다.", payload.reservation);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.18)] px-4 py-6 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="border-b border-black/10 bg-[#fbfbfa] px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                Create Reservation
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2f3437]">{currentSelection.roomName}</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm text-[#6b6a67] transition hover:bg-black/[0.03]"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 md:px-7">
          <div className="grid gap-4 md:grid-cols-2">
            <StaticField label="회의실" value={currentSelection.roomName} />
            <StaticField label="날짜" value={currentSelection.date} />
            <StaticField label="시작 시간" value={currentSelection.startTime} />
            <div className="rounded-xl border border-black/10 bg-[#fbfbfa] px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">종료 시간</p>
              <select
                value={form.endTime}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }));
                  setErrorMessage(null);
                }}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none transition focus:border-black/20"
              >
                {endTimeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 rounded-xl border border-black/10 bg-white px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                포인트 컬러
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-3.5 w-3.5 rounded-full ${colorTheme.line}`} />
                  <span className="text-sm text-[#6b6a67]">
                    저장 시 이 색상으로 예약 블록이 생성됩니다.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setColorKey(getRandomReservationColorKey())}
                  className="rounded-lg border border-black/10 px-3 py-2 text-xs text-[#6b6a67] transition hover:bg-black/[0.03]"
                >
                  다시 선택
                </button>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
              예약 목적
            </span>
            <textarea
              value={form.purpose}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  purpose: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-3 text-sm text-[#37352f] outline-none transition focus:border-black/20"
              placeholder="선택 입력"
            />
          </label>

          <div
            className={`rounded-3xl border px-4 py-4 text-sm ${
              availability.isAvailable
                ? "border-black/10 bg-[#fbfbfa] text-[#6b6a67]"
                : "border-[#d9735b]/20 bg-[#fff7f5] text-[#b42318]"
            }`}
          >
            {availability.isAvailable ? (
              <>
                현재 선택한 시간으로 예약 가능합니다.
                <br />
                종료 시각을 바꾸면 즉시 충돌 여부를 다시 확인합니다.
              </>
            ) : (
              UNAVAILABLE_MESSAGE
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/10 px-4 py-3 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={isPending || !availability.isAvailable}
              onClick={handleSubmit}
              className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "저장 중..." : "예약 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-[#fbfbfa] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#37352f]">{value}</p>
    </div>
  );
}

function buildTimeOptions() {
  const options: string[] = [];

  for (let minutes = 6 * 60 + 30; minutes <= 24 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }

  return options;
}

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getNextTimeOption(startTime: string) {
  const next = TIME_OPTIONS.find((option) => toMinutes(option) > toMinutes(startTime));
  return next ?? "24:00";
}

function buildUtcDatetime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return new Date(utcTime).toISOString();
}
