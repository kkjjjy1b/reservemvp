"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  getCreateAvailability,
  getUnavailableMessage,
} from "@/lib/reservations/client-policy";
import { getReservationColorTheme } from "@/lib/reservations/colors";
import type {
  ReservationDetailResponse,
  TimelineReservation,
} from "@/lib/reservations/types";

type ReservationDetailModalProps = {
  reservationId: string | null;
  initialDetail?: ReservationDetailResponse | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

type ReservationFormState = {
  startTime: string;
  endTime: string;
  purpose: string;
};

const TIME_OPTIONS = buildTimeOptions();
const UNAVAILABLE_MESSAGE = getUnavailableMessage();

async function fetchReservationDetail(reservationId: string) {
  const response = await fetch(`/api/reservations/${reservationId}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ReservationDetailResponse
    | { message?: string };

  if (!response.ok) {
    const errorPayload = payload as { message?: string };
    throw new Error(errorPayload.message ?? "예약 정보를 불러오지 못했습니다.");
  }

  return payload as ReservationDetailResponse;
}

export function ReservationDetailModal({
  reservationId,
  initialDetail = null,
  onClose,
  onUpdated,
}: ReservationDetailModalProps) {
  const [detail, setDetail] = useState<ReservationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [roomReservations, setRoomReservations] = useState<TimelineReservation[]>([]);
  const [form, setForm] = useState<ReservationFormState>({
    startTime: "06:00",
    endTime: "06:30",
    purpose: "",
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!reservationId) {
      setDetail(null);
      setEditMode(false);
      setShowCancelConfirm(false);
      setErrorMessage(null);
      return;
    }

    if (initialDetail && initialDetail.reservation.id === reservationId) {
      setDetail(initialDetail);
      setForm({
        startTime: initialDetail.reservation.startTime,
        endTime: initialDetail.reservation.endTime,
        purpose: initialDetail.reservation.purpose ?? "",
      });
      setIsLoading(false);
      setEditMode(false);
      setShowCancelConfirm(false);
      setErrorMessage(null);
    }

    if (initialDetail && initialDetail.reservation.id === reservationId && reloadKey === 0) {
      return;
    }

    const currentReservationId = reservationId;
    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextDetail = await fetchReservationDetail(currentReservationId);
        if (!cancelled) {
          setDetail(nextDetail);
          setForm({
            startTime: nextDetail.reservation.startTime,
            endTime: nextDetail.reservation.endTime,
            purpose: nextDetail.reservation.purpose ?? "",
          });
          setEditMode(false);
          setShowCancelConfirm(false);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "예약 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [initialDetail, reloadKey, reservationId]);

  useEffect(() => {
    if (!detail || !editMode || !detail.reservation.meetingRoom?.id) {
      setRoomReservations([]);
      return;
    }

    const reservationDate = detail.reservation.reservationDate;
    const meetingRoomId = detail.reservation.meetingRoom.id;
    let cancelled = false;

    async function loadRoomReservations() {
      try {
        const response = await fetch(`/api/reservations?date=${reservationDate}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          rooms?: Array<{
            id: string;
            reservations: TimelineReservation[];
          }>;
        };

        if (!response.ok || !payload.rooms || cancelled) {
          return;
        }

        const room = payload.rooms.find((item) => item.id === meetingRoomId);

        if (!cancelled) {
          setRoomReservations(room?.reservations ?? []);
        }
      } catch {
        if (!cancelled) {
          setRoomReservations([]);
        }
      }
    }

    loadRoomReservations();

    return () => {
      cancelled = true;
    };
  }, [detail, editMode]);

  useEffect(() => {
    if (!reservationId) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [reservationId, onClose]);

  const reservation = detail?.reservation;
  const colorTheme = reservation ? getReservationColorTheme(reservation.colorKey) : null;
  const endOptions = TIME_OPTIONS.filter(
    (option) => toMinutes(option) > toMinutes(form.startTime),
  );
  const editAvailability = useMemo(() => {
    if (!reservation || !editMode) {
      return {
        isAvailable: true,
        message: null,
      };
    }

    return getCreateAvailability({
      reservationDate: reservation.reservationDate,
      startTime: form.startTime,
      endTime: form.endTime,
      reservations: roomReservations,
      excludeReservationId: reservation.id,
    });
  }, [editMode, form.endTime, form.startTime, reservation, roomReservations]);

  if (!reservationId) {
    return null;
  }

  async function handleSave() {
    if (!detail || !reservation || !reservationId) {
      return;
    }

    const currentReservationId = reservationId;
    setErrorMessage(null);

    if (!editAvailability.isAvailable) {
      setErrorMessage(editAvailability.message ?? UNAVAILABLE_MESSAGE);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/reservations/${currentReservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          startDatetime: buildUtcDatetime(reservation.reservationDate, form.startTime),
          endDatetime: buildUtcDatetime(reservation.reservationDate, form.endTime),
          purpose: form.purpose.trim(),
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "예약 수정에 실패했습니다.");
        return;
      }

      setEditMode(false);
      setReloadKey((value) => value + 1);
      onUpdated("예약이 수정되었습니다.");
    });
  }

  async function handleConfirmCancel() {
    if (!reservationId) {
      return;
    }

    const currentReservationId = reservationId;
    startTransition(async () => {
      const response = await fetch(`/api/reservations/${currentReservationId}/cancel`, {
        method: "POST",
        credentials: "include",
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "예약 취소에 실패했습니다.");
        setShowCancelConfirm(false);
        return;
      }

      setShowCancelConfirm(false);
      onUpdated("예약이 취소되었습니다.");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.18)] px-4 py-6 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="border-b border-black/10 bg-[#fbfbfa] px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                Reservation Detail
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2f3437]">
                {reservation?.meetingRoom?.name ?? "예약 상세"}
              </h2>
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
          {isLoading && !detail ? (
            <div className="rounded-xl border border-black/10 bg-[#fbfbfa] px-4 py-6 text-sm text-[#6b6a67]">
              예약 정보를 불러오는 중입니다.
            </div>
          ) : !detail || !reservation ? (
            <div className="rounded-xl border border-black/10 bg-[#fbfbfa] px-4 py-6 text-sm text-[#6b6a67]">
              {errorMessage ?? "예약 정보를 확인할 수 없습니다."}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {colorTheme && (
                  <span
                    className={`inline-flex h-2.5 w-2.5 rounded-full ${colorTheme.line}`}
                  />
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    detail.isMine ? "bg-[#37352f] text-white" : "bg-[#efefed] text-[#5f5e5b]"
                  }`}
                >
                  {detail.isMine ? "내 예약" : "조회 전용"}
                </span>
                {!detail.canEdit && detail.isMine && (
                  <span className="rounded-md bg-[#fff1ee] px-3 py-1 text-xs font-medium text-[#b42318]">
                    예약 시작 시간이 지난 뒤에는 수정할 수 없습니다.
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <StaticField label="회의실" value={reservation.meetingRoom?.name ?? "-"} />
                <StaticField label="예약자" value={reservation.user?.name ?? "-"} />
                <StaticField label="날짜" value={reservation.reservationDate} />
                <StaticField label="상태" value={reservation.status} />
              </div>

              {editMode ? (
                <div className="grid gap-4 rounded-xl border border-black/10 bg-[#fbfbfa] p-4 md:grid-cols-2">
                  <SelectField
                    label="시작 시간"
                    value={form.startTime}
                    options={TIME_OPTIONS.filter((option) => option !== "24:00")}
                    onChange={(value) => {
                      const nextEndTime =
                        toMinutes(form.endTime) > toMinutes(value)
                          ? form.endTime
                          : getNextTimeOption(value);

                      setForm((current) => ({
                        ...current,
                        startTime: value,
                        endTime: nextEndTime,
                      }));
                    }}
                  />
                  <SelectField
                    label="종료 시간"
                    value={form.endTime}
                    options={endOptions}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        endTime: value,
                      }))
                    }
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="예약 목적"
                      value={form.purpose}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          purpose: value,
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div
                      className={`rounded-3xl border px-4 py-4 text-sm ${
                        editAvailability.isAvailable
                          ? "border-black/10 bg-white text-[#6b6a67]"
                          : "border-[#d9735b]/20 bg-[#fff7f5] text-[#b42318]"
                      }`}
                    >
                      {editAvailability.isAvailable ? (
                        <>
                          시작 시간과 종료 시간을 바꾸면 즉시 가능 여부를 다시 확인합니다.
                        </>
                      ) : (
                        UNAVAILABLE_MESSAGE
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <StaticField label="시작 시간" value={reservation.startTime} />
                  <StaticField label="종료 시간" value={reservation.endTime} />
                  <div className="md:col-span-2">
                    <StaticField label="예약 목적" value={reservation.purpose ?? "미입력"} />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setErrorMessage(null);
                        setForm({
                          startTime: reservation.startTime,
                          endTime: reservation.endTime,
                          purpose: reservation.purpose ?? "",
                        });
                      }}
                      className="rounded-lg border border-black/10 px-4 py-3 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
                    >
                      편집 취소
                    </button>
                    <button
                      type="button"
                      disabled={isPending || !editAvailability.isAvailable}
                      onClick={handleSave}
                      className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "저장 중..." : "수정 저장"}
                    </button>
                  </>
                ) : (
                  <>
                    {detail.canCancel && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setShowCancelConfirm(true)}
                        className="rounded-lg border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm font-medium text-[#b42318] transition hover:bg-[#fff1ee] disabled:opacity-60"
                      >
                        예약 취소
                      </button>
                    )}
                    {detail.isMine && (
                      <button
                        type="button"
                        disabled={!detail.canEdit || isPending}
                        onClick={() => {
                          if (!detail.canEdit) {
                            setErrorMessage("예약 시작 시간이 지난 뒤에는 수정할 수 없습니다.");
                            return;
                          }

                          setEditMode(true);
                          setErrorMessage(null);
                        }}
                        className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        편집
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showCancelConfirm && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(15,23,42,0.2)] px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
              Cancel Reservation
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[#2f3437]">
              이 예약을 취소할까요?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#6b6a67]">
              취소하면 타임라인에서 즉시 사라집니다. 이 작업은 되돌리지 않습니다.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg border border-black/10 px-4 py-3 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:opacity-60"
              >
                {isPending ? "취소 중..." : "취소 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none transition focus:border-black/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-3 text-sm text-[#37352f] outline-none transition focus:border-black/20"
        placeholder="예약 목적을 입력해 주세요."
      />
    </label>
  );
}

function buildTimeOptions() {
  const options: string[] = [];

  for (let minutes = 6 * 60; minutes <= 24 * 60; minutes += 30) {
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
