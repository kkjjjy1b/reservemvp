"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ReservationCreateModal } from "@/components/timeline/reservation-create-modal";
import { ReservationDetailModal } from "@/components/timeline/reservation-detail-modal";
import { StatusToast } from "@/components/ui/status-toast";
import { isSelectableStartSlot } from "@/lib/reservations/client-policy";
import {
  getReservationColorTheme,
  getStableRoomMeta,
} from "@/lib/reservations/colors";
import { getTimelineSlotIndex } from "@/lib/reservations/datetime";
import type {
  EmptySlotSelection,
  MeetingRoomsResponse,
  MutationReservation,
  ReservationDetailResponse,
  TimelineReservation,
  TimelineResponse,
  TimelineRoom,
} from "@/lib/reservations/types";

type TimelinePageProps = {
  selectedDate: string;
  userName: string | null;
  isAuthenticated: boolean;
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
const MOBILE_TIME_COLUMN_WIDTH_PX = 72;
const ROOM_COLUMN_MIN_WIDTH_PX = 288;
const SLOT_HEIGHT_PX = 54;

export function TimelinePage({
  selectedDate,
  userName,
  isAuthenticated,
}: TimelinePageProps) {
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileTimelineScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopTimelineHeaderRef = useRef<HTMLDivElement | null>(null);
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [roomShells, setRoomShells] = useState<TimelineRoom[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(isAuthenticated);
  const [selectedMobileRoomId, setSelectedMobileRoomId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EmptySlotSelection | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedReservationDetail, setSelectedReservationDetail] =
    useState<ReservationDetailResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [desktopHeaderHeight, setDesktopHeaderHeight] = useState(0);

  const slots = buildSlots(timelineData?.timeline.slotCount ?? 36);
  const isTodayView = isToday(currentDate);
  const currentLineOffsetPx = useMemo(() => {
    if (!timelineData || !isTodayView) {
      return null;
    }

    return getCurrentTimelineOffsetPx(now);
  }, [timelineData, isTodayView, now]);
  const currentTimeLabel = useMemo(() => getCurrentTimeLabel(now), [now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const header = desktopTimelineHeaderRef.current;

    if (!header) {
      return;
    }

    function updateDesktopHeaderHeight() {
      const nextHeader = desktopTimelineHeaderRef.current;

      if (!nextHeader) {
        return;
      }

      setDesktopHeaderHeight(nextHeader.getBoundingClientRect().height);
    }

    updateDesktopHeaderHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateDesktopHeaderHeight();
    });

    resizeObserver.observe(header);
    window.addEventListener("resize", updateDesktopHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDesktopHeaderHeight);
    };
  }, [timelineData]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!timelineData || !isTodayView || currentLineOffsetPx === null || !timelineScrollRef.current) {
      return;
    }

    const container = timelineScrollRef.current;
    const targetScrollTop = Math.max(currentLineOffsetPx - container.clientHeight * 0.28, 0);

    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [currentDate, currentLineOffsetPx, isTodayView, timelineData]);

  useEffect(() => {
    if (!timelineData || !isTodayView || currentLineOffsetPx === null || !mobileTimelineScrollRef.current) {
      return;
    }

    const container = mobileTimelineScrollRef.current;
    const targetScrollTop = Math.max(currentLineOffsetPx - container.clientHeight * 0.32, 0);

    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [currentDate, currentLineOffsetPx, isTodayView, timelineData]);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRoomShells([]);
      setTimelineData(null);
      setIsTimelineLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMeetingRooms() {
      try {
        const response = await fetch("/api/meeting-rooms", {
          method: "GET",
          credentials: "include",
          cache: "force-cache",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as MeetingRoomsResponse;

        if (!cancelled) {
          setRoomShells(
            payload.meetingRooms.map((room) => ({
              ...room,
              reservations: [],
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setRoomShells([]);
        }
      }
    }

    loadMeetingRooms();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTimelineData(null);
      setIsTimelineLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      setIsTimelineLoading(true);

      try {
        const response = await fetch(`/api/reservations?date=${currentDate}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setTimelineData(null);
          }
          return;
        }

        const payload = (await response.json()) as TimelineResponse;

        if (!cancelled) {
          setTimelineData(payload);
        }
      } catch {
        if (!cancelled) {
          setTimelineData(null);
        }
      } finally {
        if (!cancelled) {
          setIsTimelineLoading(false);
        }
      }
    }

    loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [currentDate, isAuthenticated]);

  function updateDate(nextDate: string) {
    setSelectedSlot(null);
    setSelectedReservationId(null);
    setSelectedReservationDetail(null);
    setCurrentDate(nextDate);
    window.history.replaceState({}, "", `/?date=${nextDate}`);
  }

  function shiftDate(days: number) {
    const nextDate = new Date(`${currentDate}T00:00:00+09:00`);
    nextDate.setDate(nextDate.getDate() + days);
    updateDate(toDateInputValue(nextDate));
  }

  function jumpToToday() {
    updateDate(getTodayDateKey());
  }

  function refreshTimeline(message?: string) {
    setSelectedSlot(null);
    setSelectedReservationId(null);
    setSelectedReservationDetail(null);
    setTimelineData(null);
    setIsTimelineLoading(true);
    if (message) {
      setToastMessage(message);
    }
    void (async () => {
      try {
        const response = await fetch(`/api/reservations?date=${currentDate}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setTimelineData(null);
          return;
        }

        const payload = (await response.json()) as TimelineResponse;
        setTimelineData(payload);
      } finally {
        setIsTimelineLoading(false);
      }
    })();
  }

  function applyReservationMutation(action: "create" | "update" | "cancel", reservation: MutationReservation) {
    setTimelineData((current) => {
      if (!current) {
        return current;
      }

      const nextRooms = current.rooms.map((room) => ({
        ...room,
        reservations: room.reservations.filter((item) => item.id !== reservation.id),
      }));

      if (action === "cancel" || reservation.status === "cancelled") {
        return {
          ...current,
          rooms: nextRooms,
        };
      }

      const roomId = reservation.meetingRoom?.id;

      if (!roomId) {
        return {
          ...current,
          rooms: nextRooms,
        };
      }

      const roomIndex = nextRooms.findIndex((room) => room.id === roomId);

      if (roomIndex === -1) {
        return {
          ...current,
          rooms: nextRooms,
        };
      }

      const nextReservation = toTimelineReservation(reservation, userName);
      const room = nextRooms[roomIndex];
      const roomReservations = [...room.reservations, nextReservation].sort(
        (left, right) => left.startSlotIndex - right.startSlotIndex,
      );

      nextRooms[roomIndex] = {
        ...room,
        reservations: roomReservations,
      };

      return {
        ...current,
        rooms: nextRooms,
      };
    });
  }

  const visibleRooms = timelineData?.rooms ?? roomShells;
  const activeDate = timelineData?.date ?? currentDate;
  const selectedMobileRoom =
    visibleRooms.find((room) => room.id === selectedMobileRoomId) ?? visibleRooms[0] ?? null;

  useEffect(() => {
    if (visibleRooms.length === 0) {
      setSelectedMobileRoomId(null);
      return;
    }

    setSelectedMobileRoomId((current) =>
      current && visibleRooms.some((room) => room.id === current) ? current : visibleRooms[0].id,
    );
  }, [visibleRooms]);

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
                value={currentDate}
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

        {!isAuthenticated ? (
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
        ) : isTimelineLoading && visibleRooms.length === 0 ? (
          <section className="px-6 py-12 md:px-8">
            <div className="mx-auto max-w-[680px] rounded-[24px] border border-black/10 bg-[#fcfcfb] px-6 py-10 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[#2f3437]" />
              <p className="mt-5 text-lg font-semibold text-[#2f3437]">
                타임라인을 불러오는 중입니다.
              </p>
              <p className="mt-2 text-sm text-[#6b6a67]">
                로그인은 완료되었고, 오늘 예약 현황을 불러오고 있습니다.
              </p>
            </div>
          </section>
        ) : !timelineData ? (
          <section className="p-3 md:p-5">
            <div className="rounded-[20px] border border-black/10 bg-[#fcfcfb]">
              <div className="border-b border-black/10 px-4 py-4 md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visibleRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedMobileRoomId(room.id)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                        room.id === selectedMobileRoom?.id
                          ? "border-[#2f3437] bg-[#2f3437] text-white"
                          : "border-black/10 bg-white text-[#6b6a67]"
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 py-8 text-center md:hidden">
                <p className="text-lg font-semibold text-[#2f3437]">
                  예약 현황을 불러오는 중입니다.
                </p>
                <p className="mt-2 text-sm text-[#6b6a67]">
                  모바일에서는 회의실별 세로 타임라인으로 표시합니다.
                </p>
                <button
                  type="button"
                  onClick={() => refreshTimeline()}
                  className="mt-5 inline-flex rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#37352f] transition hover:bg-black/[0.03]"
                >
                  다시 시도
                </button>
              </div>
              <div className="overflow-x-auto rounded-[20px]">
                <div
                  className="hidden min-w-[1220px] md:block"
                  style={{
                    minWidth:
                      TIME_COLUMN_WIDTH_PX +
                      visibleRooms.length * ROOM_COLUMN_MIN_WIDTH_PX,
                  }}
                >
                  <div className="border-b border-black/10 bg-[#fcfcfb]">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX}px repeat(${visibleRooms.length}, minmax(${ROOM_COLUMN_MIN_WIDTH_PX}px, 1fr))`,
                      }}
                    >
                      <div className="border-r border-black/10 px-4 py-5" />
                      {visibleRooms.map((room) => (
                        <div
                          key={room.id}
                          className="border-r border-black/10 px-5 py-5 last:border-r-0"
                        >
                          <p className="text-[16px] font-semibold text-[#2f3437] md:text-[18px]">
                            {room.name}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-sm text-[#787774]">
                            <span>{room.capacity !== null ? `${room.capacity}명` : "-"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-10 text-center">
                    <p className="text-lg font-semibold text-[#2f3437]">
                      예약 현황을 불러오는 중입니다.
                    </p>
                    <p className="mt-2 text-sm text-[#6b6a67]">
                      회의실 목록은 먼저 표시했고, 예약 데이터는 이어서 가져오고 있습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => refreshTimeline()}
                      className="mt-5 inline-flex rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#37352f] transition hover:bg-black/[0.03]"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="p-3 md:p-5">
            <div className="rounded-[20px] border border-black/10 bg-[#fcfcfb]">
              <div className="border-b border-black/10 px-4 py-4 md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {timelineData.rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedMobileRoomId(room.id)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                        room.id === selectedMobileRoom?.id
                          ? "border-[#2f3437] bg-[#2f3437] text-white"
                          : "border-black/10 bg-white text-[#6b6a67]"
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
                {selectedMobileRoom && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2f3437]">{selectedMobileRoom.name}</p>
                      <p className="mt-1 text-xs text-[#787774]">
                        {selectedMobileRoom.capacity !== null ? `${selectedMobileRoom.capacity}명` : "-"}
                      </p>
                    </div>
                    <span className="text-xs text-[#9b9a97]">세로 보기</span>
                  </div>
                )}
              </div>
              {selectedMobileRoom && (
                <div className="md:hidden">
                  <div
                    ref={mobileTimelineScrollRef}
                    className="overflow-y-auto"
                    style={{
                      height: "calc(100vh - 360px)",
                      minHeight: "480px",
                    }}
                  >
                    <div className="relative">
                      {currentLineOffsetPx !== null && (
                        <>
                          <div
                            className="pointer-events-none absolute z-20"
                            style={{
                              top: `${currentLineOffsetPx}px`,
                              left: `${MOBILE_TIME_COLUMN_WIDTH_PX - 1}px`,
                              right: 0,
                            }}
                          >
                            <div className="relative h-[2px] bg-[#68aef8]/80">
                              <span className="absolute -left-[8px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#68aef8] shadow-[0_0_0_1px_rgba(104,174,248,0.32)]" />
                            </div>
                          </div>
                          <div
                            className="pointer-events-none absolute left-0 z-20 flex items-center justify-end pr-3"
                            style={{
                              top: `${currentLineOffsetPx}px`,
                              width: `${MOBILE_TIME_COLUMN_WIDTH_PX}px`,
                              transform: "translateY(-50%)",
                            }}
                          >
                            <span className="rounded-full border border-[#bfdbfe] bg-white px-2 py-1 text-[10px] font-medium text-[#3b82f6] shadow-sm">
                              {currentTimeLabel}
                            </span>
                          </div>
                        </>
                      )}
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `${MOBILE_TIME_COLUMN_WIDTH_PX}px minmax(0, 1fr)`,
                        }}
                      >
                        <div className="border-r border-black/10 bg-[#fcfcfb]">
                          {slots.map((slot) => (
                            <div
                              key={slot.index}
                              className="relative border-b border-black/[0.06] px-2"
                              style={{ height: `${SLOT_HEIGHT_PX}px` }}
                            >
                              {slot.isHour && (
                                <span className="absolute -top-3 right-2 bg-[#fcfcfb] px-1 text-[11px] font-medium text-[#6b6a67]">
                                  {slot.time}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <TimelineRoomColumn
                          room={selectedMobileRoom}
                          date={activeDate}
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
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-[20px]">
                <div
                  className="hidden min-w-[1220px] md:block"
                  style={{
                    minWidth:
                      TIME_COLUMN_WIDTH_PX +
                      timelineData.rooms.length * ROOM_COLUMN_MIN_WIDTH_PX,
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
                        ref={desktopTimelineHeaderRef}
                        className="sticky top-0 z-30 grid border-b border-black/10 bg-[#fcfcfb]"
                        style={{
                          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX}px repeat(${timelineData.rooms.length}, minmax(${ROOM_COLUMN_MIN_WIDTH_PX}px, 1fr))`,
                        }}
                      >
                        <div className="border-r border-black/10 px-4 py-5" />

                        {timelineData.rooms.map((room) => {
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
                              top: `${desktopHeaderHeight + currentLineOffsetPx}px`,
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
                              top: `${desktopHeaderHeight + currentLineOffsetPx}px`,
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
                          gridTemplateColumns: `${TIME_COLUMN_WIDTH_PX}px repeat(${timelineData.rooms.length}, minmax(${ROOM_COLUMN_MIN_WIDTH_PX}px, 1fr))`,
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

                        {timelineData.rooms.map((room) => (
                          <TimelineRoomColumn
                            key={room.id}
                            room={room}
                            date={timelineData.date}
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
        onUpdated={({ message, action, reservation }) => {
          applyReservationMutation(action, reservation);
          setToastMessage(message);
        }}
      />
      <ReservationCreateModal
        selection={selectedSlot}
        roomReservations={
          selectedSlot
            ? timelineData?.rooms.find((room) => room.id === selectedSlot.roomId)?.reservations ?? []
            : []
        }
        onClose={() => setSelectedSlot(null)}
        onCreated={(message, reservation) => {
          applyReservationMutation("create", reservation);
          setToastMessage(message);
        }}
      />
    </main>
  );
}

function toTimelineReservation(reservation: MutationReservation, currentUserName: string | null) {
  const startDatetime = new Date(reservation.startDatetime);
  const endDatetime = new Date(reservation.endDatetime);
  const startSlotIndex = getTimelineSlotIndex(startDatetime);
  const slotSpan = (endDatetime.getTime() - startDatetime.getTime()) / (30 * 60 * 1000);

  return {
    id: reservation.id,
    title: reservation.purpose,
    colorKey: reservation.colorKey,
    startDatetime: reservation.startDatetime,
    endDatetime: reservation.endDatetime,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    startSlotIndex,
    endSlotIndex: startSlotIndex + slotSpan,
    slotSpan,
    user: {
      name: reservation.user?.name ?? currentUserName ?? "나",
    },
    isMine: true,
    status: "active" as const,
  };
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
