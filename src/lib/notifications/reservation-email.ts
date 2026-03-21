import { formatKstTime, getKstDateKey } from "@/lib/reservations/datetime";
import { getMailProvider, type MailMessage } from "@/lib/notifications/send-mail";

type ReservationEmailRecipient = {
  name: string;
  companyEmail: string;
};

type ReservationEmailPayload = {
  reservationId: string;
  roomName: string;
  reservationDate: string;
  startDatetime: Date;
  endDatetime: Date;
  purpose?: string | null;
  ownerName: string;
  ownerEmail: string;
  participants: ReservationEmailRecipient[];
};

function isReservationEmailConfigured() {
  return getMailProvider().isConfigured();
}

function getAppBaseUrl() {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ""
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildReservationSummary(payload: ReservationEmailPayload) {
  const reservationDate = payload.reservationDate || getKstDateKey(payload.startDatetime);
  const startTime = formatKstTime(payload.startDatetime);
  const endTime = formatKstTime(payload.endDatetime);
  const appBaseUrl = getAppBaseUrl();
  const appLink = appBaseUrl ? `${appBaseUrl}/` : null;

  return {
    subject: `[회의실 예약 알림] ${payload.roomName} ${reservationDate} ${startTime}-${endTime}`,
    text: [
      `${payload.ownerName}님이 회의실 예약을 생성했습니다.`,
      "",
      `회의실: ${payload.roomName}`,
      `예약일: ${reservationDate}`,
      `시간: ${startTime} - ${endTime} (KST)`,
      `예약자: ${payload.ownerName} (${payload.ownerEmail})`,
      `목적: ${payload.purpose?.trim() || "미입력"}`,
      ...(appLink ? ["", `서비스 바로가기: ${appLink}`] : []),
    ].join("\n"),
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#1f2937">
        <p><strong>${escapeHtml(payload.ownerName)}</strong>님이 회의실 예약을 생성했습니다.</p>
        <table style="border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">회의실</td><td style="padding:4px 0">${escapeHtml(payload.roomName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">예약일</td><td style="padding:4px 0">${escapeHtml(reservationDate)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">시간</td><td style="padding:4px 0">${escapeHtml(startTime)} - ${escapeHtml(endTime)} (KST)</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">예약자</td><td style="padding:4px 0">${escapeHtml(payload.ownerName)} (${escapeHtml(payload.ownerEmail)})</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">목적</td><td style="padding:4px 0">${escapeHtml(payload.purpose?.trim() || "미입력")}</td></tr>
        </table>
        ${
          appLink
            ? `<p style="margin-top:20px"><a href="${escapeHtml(appLink)}" style="color:#2563eb;text-decoration:none">서비스 바로가기</a></p>`
            : ""
        }
      </div>
    `,
  };
}

export async function sendReservationCreatedNotifications(
  payload: ReservationEmailPayload,
) {
  if (!isReservationEmailConfigured() || payload.participants.length === 0) {
    return;
  }

  const message = buildReservationSummary(payload);
  const mailProvider = getMailProvider();
  const replyTo = process.env.RESERVATION_REPLY_TO_EMAIL?.trim() || undefined;

  await Promise.all(
    payload.participants.map((participant) => {
      const mailMessage: MailMessage = {
        to: [participant.companyEmail],
        subject: message.subject,
        text: `안녕하세요 ${participant.name}님.\n\n${message.text}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#1f2937">
            <p>안녕하세요 ${escapeHtml(participant.name)}님.</p>
            ${message.html}
          </div>
        `,
        replyTo,
        idempotencyKey: `reservation-created:${payload.reservationId}:${participant.companyEmail}`,
      };

      return mailProvider.send(mailMessage);
    }),
  );
}
