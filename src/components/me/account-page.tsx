"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";

import { ReservationDetailModal } from "@/components/timeline/reservation-detail-modal";
import { StatusToast } from "@/components/ui/status-toast";
import type { CurrentUserProfile, MyReservationItem } from "@/lib/account/types";

type AccountPageProps = {
  user: CurrentUserProfile;
  initialReservations: MyReservationItem[];
};

type ProfileFormState = {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function AccountPage({ user, initialReservations }: AccountPageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(user);
  const [reservations, setReservations] = useState(initialReservations);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutErrorMessage, setLogoutErrorMessage] = useState<string | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isLogoutPending, startLogoutTransition] = useTransition();
  const [isSavingProfile, startSaveTransition] = useTransition();
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: user.name,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function refreshReservations(successMessage?: string) {
    setErrorMessage(null);

    startRefreshTransition(async () => {
      const response = await fetch("/api/me/reservations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        message?: string;
        reservations?: MyReservationItem[];
      };

      if (!response.ok || !payload.reservations) {
        setErrorMessage(payload.message ?? "내 예약 목록을 다시 불러오지 못했습니다.");
        return;
      }

      setReservations(payload.reservations);

      if (successMessage) {
        setToastMessage(successMessage);
      }
    });
  }

  function openProfileModal() {
    setProfileForm({
      name: profile.name,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setProfileFormError(null);
    setProfileModalOpen(true);
  }

  function closeProfileModal() {
    setProfileModalOpen(false);
    setProfileFormError(null);
  }

  function handleProfileSave() {
    setProfileFormError(null);

    const trimmedName = profileForm.name.trim();
    const shouldChangePassword =
      profileForm.currentPassword || profileForm.newPassword || profileForm.confirmPassword;

    if (!trimmedName) {
      setProfileFormError("이름을 입력해 주세요.");
      return;
    }

    if (shouldChangePassword) {
      if (
        !profileForm.currentPassword ||
        !profileForm.newPassword ||
        !profileForm.confirmPassword
      ) {
        setProfileFormError("비밀번호 변경 시 모든 비밀번호 입력값을 작성해 주세요.");
        return;
      }

      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileFormError("새 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    startSaveTransition(async () => {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        user?: CurrentUserProfile;
      };

      if (!response.ok || !payload.user) {
        setProfileFormError(payload.message ?? "프로필 변경에 실패했습니다.");
        return;
      }

      setProfile(payload.user);
      setProfileModalOpen(false);
      setProfileForm({
        name: payload.user.name,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setToastMessage("프로필이 변경되었습니다.");
    });
  }

  function handleLogout() {
    setLogoutErrorMessage(null);

    startLogoutTransition(async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setLogoutErrorMessage(payload.message ?? "로그아웃에 실패했습니다.");
        return;
      }

      router.replace("/login");
      router.refresh();
    });
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
                  Account
                </p>
                <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[#2f3437] md:text-[26px]">
                  계정 관리
                </h1>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <IconActionButton
                label="뒤로가기"
                onClick={() => router.push("/")}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                }
              />
              <IconActionButton
                label={isLogoutPending ? "로그아웃 중..." : "로그아웃"}
                onClick={handleLogout}
                disabled={isLogoutPending}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                }
              />
            </div>
          </div>
        </header>

        <section className="grid gap-5 p-3 md:grid-cols-[0.86fr_1.14fr] md:p-5">
          <div className="space-y-5">
            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                    Profile
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-[#2f3437]">내 정보</h2>
                </div>
                <IconCircleButton
                  label="프로필 수정"
                  onClick={openProfileModal}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  }
                />
              </div>

              <div className="mt-5 grid gap-3">
                <InfoRow label="이름" value={profile.name} />
                <InfoRow label="회사 이메일" value={profile.companyEmail} />
                <InfoRow label="계정 상태" value={profile.isActive ? "활성" : "비활성"} />
                <InfoRow
                  label="비밀번호 변경 시각"
                  value={
                    profile.passwordChangedAt
                      ? formatDateTime(profile.passwordChangedAt)
                      : "기록 없음"
                  }
                />
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                  My Reservations
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#2f3437]">내 예약 목록</h2>
              </div>
              <IconActionButton
                label={isRefreshing ? "갱신 중..." : "새로고침"}
                onClick={() => refreshReservations()}
                disabled={isRefreshing}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
                  </svg>
                }
              />
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
                {errorMessage}
              </div>
            )}

            {logoutErrorMessage && (
              <div className="mt-4 rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
                {logoutErrorMessage}
              </div>
            )}

            {reservations.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-black/10 bg-[#fbfbfa] px-5 py-8 text-sm text-[#6b6a67]">
                아직 예약한 내역이 없습니다.
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-black/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-[#fbfbfa] text-[#9b9a97]">
                      <tr>
                        <TableHeader>회의실</TableHeader>
                        <TableHeader>예약 날짜</TableHeader>
                        <TableHeader>시작</TableHeader>
                        <TableHeader>종료</TableHeader>
                        <TableHeader>예약 목적</TableHeader>
                        <TableHeader>상태</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {reservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className={`border-t border-black/5 transition ${
                            reservation.status === "active"
                              ? "cursor-pointer hover:bg-black/[0.02]"
                              : "cursor-default bg-black/[0.02]"
                          }`}
                          onClick={() => {
                            if (reservation.status !== "active") {
                              return;
                            }

                            setSelectedReservationId(reservation.id);
                          }}
                        >
                          <TableCell>{reservation.meetingRoom?.name ?? "-"}</TableCell>
                          <TableCell>{reservation.reservationDate}</TableCell>
                          <TableCell>{reservation.startTime}</TableCell>
                          <TableCell>{reservation.endTime}</TableCell>
                          <TableCell>{reservation.purpose ?? "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                reservation.status === "active"
                                  ? "bg-[#eef6ee] text-[#2f6f42]"
                                  : "bg-[#f3f1f1] text-[#8b8a86]"
                              }`}
                            >
                              {reservation.status === "active" ? "예약 완료" : "예약 취소"}
                            </span>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </section>
      </section>

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.18)] px-4 py-6 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={closeProfileModal} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
            <div className="border-b border-black/10 bg-[#fbfbfa] px-6 py-5 md:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9a97]">
                    Edit Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#2f3437]">프로필 수정</h2>
                </div>

                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm text-[#6b6a67] transition hover:bg-black/[0.03]"
                >
                  취소
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6 md:px-7">
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
                  이름
                </span>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20"
                  placeholder="이름"
                />
              </label>

              <div className="grid gap-4">
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787774]">
                    Current Password
                  </span>
                  <input
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
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
                    value={profileForm.newPassword}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
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
                    value={profileForm.confirmPassword}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#37352f] outline-none transition placeholder:text-[#9b9a97] focus:border-black/20"
                    placeholder="새 비밀번호 확인"
                  />
                </label>
              </div>

              {profileFormError && (
                <div className="rounded-xl border border-[#d9735b]/20 bg-[#fff7f5] px-4 py-3 text-sm text-[#b42318]">
                  {profileFormError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="rounded-lg border border-black/10 px-4 py-3 text-sm text-[#37352f] transition hover:bg-black/[0.03]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={isSavingProfile}
                  className="rounded-lg bg-[#2f3437] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f2326] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? "저장 중..." : "완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReservationDetailModal
        reservationId={selectedReservationId}
        onClose={() => setSelectedReservationId(null)}
        onUpdated={({ message }) => {
          refreshReservations(message);
        }}
      />
    </main>
  );
}

function IconActionButton({
  label,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-[74px] flex-col items-center gap-2 text-[#6b6a67] transition hover:text-[#2f3437] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        {icon}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function IconCircleButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#6b6a67] shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:translate-y-[-1px] hover:bg-black/[0.03] hover:text-[#2f3437]"
    >
      {icon}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-[#fbfbfa] px-4 py-4">
      <dt className="text-sm text-[#9b9a97]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[#37352f]">{value}</dd>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em]">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 align-top text-[#4f4e4b]">{children}</td>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}
