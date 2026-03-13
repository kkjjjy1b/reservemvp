"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ReservationCreateModal } from "@/components/timeline/reservation-create-modal";
import { ReservationDetailModal } from "@/components/timeline/reservation-detail-modal";
import { StatusToast } from "@/components/ui/status-toast";
import { isSelectableStartSlot } from "@/lib/reservations/client-policy";
import {
  getReservationColorTheme,
  getStableRoomMeta,
} from "@/lib/reservations/colors";
import type {
  EmptySlotSelection,
  ReservationDetailResponse,
  TimelineReservation,
  TimelineResponse,
  TimelineRoom,
} from "@/lib/reservations/types";

type TimelinePageProps = {
  data: TimelineResponse | null;
  selectedDate: string;
  userName: string | null;
};

type SlotDescriptor = {
  index: number;
  time: string;
  isHour: boolean;
};

type TimelineRoomColumnProps = {
  room: TimelineRoom;
  date: string;
  slots: SlotDescriptor[];
  onSlotClick: (selection: EmptySlotSelection) => void;
  onReservationClick: (
    reservationId: string,
    detail: ReservationDetailResponse,
  ) => void;
};

const TIME_COLUMN_WIDTH_PX = 96;
const ROOM_COLUMN_MIN_WIDTH_PX = 288;
const SLOT_HEIGHT_PX = 54;

export function TimelinePage({
  data,
  selectedDate,
  userName,
}: TimelinePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EmptySlotSelection | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedReservationDetail, setSelectedReservationDetail] =
    useState<ReservationDetailResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const slots = buildSlots(data?.timeline.slotCount ?? 36);
  const isTodayView = isToday(selectedDate);
  const currentLineOffsetPx = useMemo(() => {
    if (!data || !isTodayView) {
      return null;
    }

    return getCurrentTimelineOffsetPx(now);
  }, [data, isTodayView, now]);
  const currentTimeLabel = useMemo(() => getCurrentTimeLabel(now), [now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!data || !isTodayView || currentLineOffsetPx === null || !timelineScrollRef.current) {
      return;
    }

    const container = timelineScrollRef.current;
    const targetScrollTop = Math.max(currentLineOffsetPx - container.clientHeight * 0.28, 0);

    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [currentLineOffsetPx, data, isTodayView, selectedDate]);

  function updateDate(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);
    router.replace(`/?${params.toString()}`);
  }

  function shiftDate(days: number) {
    const nextDate = new Date(`${selectedDate}T00:00:00+09:00`);
    nextDate.setDate(nextDate.getDate() + days);
    updateDate(toDateInputValue(nextDate));
  }

  function jumpToToday() {
    updateDate(getTodayDateKey());
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-3 md:px-5 md:py-5">
      {toastMessage && (
        <StatusToast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      <section className="mx-auto max-w-[1640px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
        <header className="border-b border-black/10 bg-[#fcfcfb]">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-7">
            <div className="flex min-w-0 items-center gap-4">
              <div className="hidden h-10 w-px bg-black/10 md:block" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9b9a97]">
                  청림 인베스트
                </p>
                <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[#2f3437] md:text-[26px]">
                  회의실
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ProfileButton userName={userName} />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-black/10 px-5 py-4 md:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
              >
                이전 날
              </button>
              <button
                type="button"
                onClick={jumpToToday}
                className="rounded-xl border border-[#d9d8d3] bg-[#f6f5f3] px-3.5 py-2.5 text-sm font-medium text-[#37352f] transition hover:bg-[#efeeeb]"
              >
                오늘
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => updateDate(event.target.value)}
                className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#37352f] outline-none transition focus:border-black/20"
              />
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
              >
                다음 날
              </button>
            </div>
          </div>
        </header>

        {!data ? (
          <section className="px-6 py-12 text-center md:px-8">
            <p className="text-lg font-semibold text-[#2f3437]">
              로그인 후 타임라인을 확인할 수 있습니다.
            </p>
            <p className="mt-2 text-sm text-[#6b6a67]">
              로그인 화면에서 인증을 마치면 메인 타임라인으로 돌아와 예약 현황과 생성
              흐름을 바로 사용할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#37352f] transition hover:bg-black/[0.03]"
            >
              로그인 화면으로 이동
            </Link>
          </section>
        ) : (
          <section className="p-3 md:p-5">
            <div className="rounded-[20px] border border-black/10 bg-[#fcfcfb]">
              <div className="overflow-x-auto rounded-[20px]">
                <div
                  className="min-w-[1220px]"
                  style={{
                    minWidth:
                      TIME_COLUMN_WIDTH_PX +
                      data.rooms.length * ROOM_COLUMN_MIN_WIDTH_PX,
                  }}
                >
                  <div
                    ref={timelineScrollRef}
                    className="overflow-y-auto rounded-b-[20px]"
                    style={{
                      height: "calc(100vh - 330px)",
                      minHeight: "560px",
                      scrollbarGutter: "stable",
                    }}
                  >
                    <div className="relative">
                      <div
                        className="sticky top-0 z-30 grid border-b border-black/10 bg-[#fcfcfb]"
                        style={{
                          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX}px repeat(${data.rooms.length}, minmax(${ROOM_COLUMN_MIN_WIDTH_PX}px, 1fr))`,
                        }}
                      >
                        <div className="border-r border-black/10 px-4 py-5" />

                        {data.rooms.map((room) => {
                          const roomMeta = getStableRoomMeta(room.id);
                          const roomColor = getReservationColorTheme(roomMeta.colorKey);

                          return (
                            <div
                              key={room.id}
                              className="border-r border-black/10 px-5 py-5 last:border-r-0"
                            >
                              <p className="text-[16px] font-semibold text-[#2f3437] md:text-[18px]">
                                {room.name}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 text-sm text-[#787774]">
                                <span
                                  className={`inline-flex h-2.5 w-2.5 rounded-full ${roomColor.line}`}
                                />
                                <span>{room.capacity !== null ? `${room.capacity}명` : "-"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {currentLineOffsetPx !== null && (
                        <>
                          <div
                            className="pointer-events-none absolute z-20"
                            style={{
                              top: `${currentLineOffsetPx}px`,
                              left: `${TIME_COLUMN_WIDTH_PX - 1}px`,
                              right: 0,
                            }}
                          >
                            <div className="relative h-[2px] bg-[#68aef8]/80">
                              <span className="absolute -left-[8px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#68aef8] shadow-[0_0_0_1px_rgba(104,174,248,0.32)]" />
                            </div>
                          </div>
                          <div
                            className="pointer-events-none absolute left-0 z-20 flex items-center justify-end pr-5"
                            style={{
                              top: `${currentLineOffsetPx}px`,
                              width: `${TIME_COLUMN_WIDTH_PX}px`,
                              transform: "translateY(-50%)",
                            }}
                          >
                            <span className="rounded-full border border-[#bfdbfe] bg-white px-2 py-1 text-[11px] font-medium text-[#3b82f6] shadow-sm">
                              {currentTimeLabel}
                            </span>
                          </div>
                        </>
                      )}

                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX}px repeat(${data.rooms.length}, minmax(${ROOM_COLUMN_MIN_WIDTH_PX}px, 1fr))`,
                        }}
                      >
                        <div className="border-r border-black/10 bg-[#fcfcfb]">
                          {slots.map((slot) => (
                            <div
                              key={slot.index}
                              className="relative border-b border-black/[0.06] px-3"
                              style={{ height: `${SLOT_HEIGHT_PX}px` }}
                            >
                              {slot.isHour && (
                                <span className="absolute -top-3 right-3 bg-[#fcfcfb] px-2 text-[13px] font-medium text-[#6b6a67]">
                                  {slot.time}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {data.rooms.map((room) => (
                          <TimelineRoomColumn
                            key={room.id}
                            room={room}
                            date={data.date}
                            slots={slots}
                            onSlotClick={(slot) => {
                              setSelectedReservationId(null);
                              setSelectedReservationDetail(null);
                              setSelectedSlot(slot);
                            }}
                            onReservationClick={(reservationId, detail) => {
                              setSelectedSlot(null);
                              setSelectedReservationDetail(detail);
                              setSelectedReservationId(reservationId);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>

      <ReservationDetailModal
        reservationId={selectedReservationId}
        initialDetail={selectedReservationDetail}
        onClose={() => {
          setSelectedReservationId(null);
          setSelectedReservationDetail(null);
        }}
        onUpdated={(message) => {
          router.refresh();
          setToastMessage(message);
        }}
      />
      <ReservationCreateModal
        selection={selectedSlot}
        roomReservations={
          selectedSlot
            ? data?.rooms.find((room) => room.id === selectedSlot.roomId)?.reservations ?? []
            : []
        }
        onClose={() => setSelectedSlot(null)}
        onCreated={(message) => {
          router.refresh();
          setToastMessage(message);
        }}
      />
    </main>
  );
}

function TimelineRoomColumn({
  room,
  date,
  slots,
  onSlotClick,
  onReservationClick,
}: TimelineRoomColumnProps) {
  const blockedSlots = new Set<number>();

  for (const reservation of room.reservations) {
    for (
      let slotIndex = reservation.startSlotIndex;
      slotIndex < reservation.endSlotIndex;
      slotIndex += 1
    ) {
      blockedSlots.add(slotIndex);
    }
  }

  return (
    <div className="relative border-r border-black/10 last:border-r-0">
      {slots.map((slot) => {
        const isPolicyBlocked = !isSelectableStartSlot(date, slot.time);
        const isBlocked = blockedSlots.has(slot.index) || isPolicyBlocked;

        return (
          <button
            key={`${room.id}-${slot.index}`}
            type="button"
            disabled={isBlocked}
            onClick={() =>
              onSlotClick({
                date,
                roomId: room.id,
                roomName: room.name,
                slotIndex: slot.index,
                startTime: slot.time,
                startDatetime: buildUtcDatetime(date, slot.time),
              })
            }
            className={`group flex w-full items-center border-b border-black/[0.06] px-4 transition ${
              isBlocked
                ? "cursor-not-allowed bg-white"
                : "bg-white hover:bg-[#f6faff]"
            }`}
            style={{ height: `${SLOT_HEIGHT_PX}px` }}
          >
            {!isBlocked && (
              <span className="text-[11px] text-[#c1c0bc] transition group-hover:text-[#6b6a67]">
                예약 가능
              </span>
            )}
          </button>
        );
      })}

      <div className="pointer-events-none absolute inset-0">
        {room.reservations.map((reservation) => (
          <TimelineReservationCard
            key={reservation.id}
            reservation={reservation}
            room={room}
            date={date}
            onClick={(detail) => onReservationClick(reservation.id, detail)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineReservationCard({
  reservation,
  room,
  date,
  onClick,
}: {
  reservation: TimelineReservation;
  room: TimelineRoom;
  date: string;
  onClick: (detail: ReservationDetailResponse) => void;
}) {
  const colorTheme = getReservationColorTheme(reservation.colorKey);
  const initialDetail = useMemo<ReservationDetailResponse>(
    () => ({
      reservation: {
        id: reservation.id,
        colorKey: reservation.colorKey,
        reservationDate: date,
        startDatetime: reservation.startDatetime,
        endDatetime: reservation.endDatetime,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        purpose: reservation.title,
        status: reservation.status,
        user: {
          name: reservation.user.name,
        },
        meetingRoom: {
          id: room.id,
          name: room.name,
        },
      },
      isMine: reservation.isMine,
      canEdit: reservation.isMine && new Date(reservation.startDatetime).getTime() > Date.now(),
      canCancel: reservation.isMine,
    }),
    [date, reservation, room.id, room.name],
  );

  return (
    <button
      type="button"
      onClick={() => onClick(initialDetail)}
      className={`pointer-events-auto absolute left-3 right-3 overflow-hidden rounded-[22px] border bg-white text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${colorTheme.border}`}
      style={{
        top: `${reservation.startSlotIndex * SLOT_HEIGHT_PX + 4}px`,
        height: `${reservation.slotSpan * SLOT_HEIGHT_PX - 8}px`,
      }}
    >
      <div className="flex h-full">
        <div className={`w-[4px] shrink-0 ${colorTheme.line}`} />
        <div className="flex flex-1 flex-col px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[#2f3437]">
                {reservation.title ?? "예약"}
              </p>
              <p className="mt-1 text-[13px] text-[#787774]">
                {reservation.startTime} - {reservation.endTime}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {reservation.isMine && (
                <span className="rounded-full bg-[#37352f] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white">
                  내 예약
                </span>
              )}
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${colorTheme.line}`} />
            </div>
          </div>

          <p className="mt-2 text-[13px] text-[#6b6a67]">{reservation.user.name}</p>
        </div>
      </div>
    </button>
  );
}

function ProfileButton({ userName }: { userName: string | null }) {
  const initial = (userName?.trim().charAt(0) || "M").toUpperCase();

  return (
    <Link
      href="/me"
      aria-label="내 정보 화면으로 이동"
      title="내 정보"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e8c768] bg-[#f6d463] text-sm font-semibold text-[#2f3437] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:translate-y-[-1px] hover:shadow-[0_8px_18px_rgba(232,199,104,0.28)]"
    >
      <span className="sr-only">내 정보</span>
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/75">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="absolute h-5 w-5 text-[#6b6a67]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
          <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
        </svg>
        <span className="text-[10px] font-semibold text-[#2f3437]">{initial}</span>
      </span>
    </Link>
  );
}

function buildSlots(slotCount: number): SlotDescriptor[] {
  return Array.from({ length: slotCount }, (_, index) => {
    const totalMinutes = 6 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    return {
      index,
      time,
      isHour: minute === 0,
    };
  });
}

function isToday(dateKey: string) {
  return dateKey === getTodayDateKey();
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentTimelineOffsetPx(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const totalMinutes = hour * 60 + minute;
  const timelineStartMinutes = 6 * 60;
  const timelineEndMinutes = 24 * 60;
  const clampedMinutes = Math.min(Math.max(totalMinutes, timelineStartMinutes), timelineEndMinutes);

  return ((clampedMinutes - timelineStartMinutes) / 30) * SLOT_HEIGHT_PX;
}

function getCurrentTimeLabel(now: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

function buildUtcDatetime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return new Date(utcTime).toISOString();
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
