const { PrismaClient, ReservationStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const INITIAL_PASSWORD = "Welcome123!";
const SALT_ROUNDS = 12;
const TIME_ZONE = "Asia/Seoul";

const sampleUsers = [
  {
    companyEmail: "user-a@company.com",
    name: "김민지",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "user-b@company.com",
    name: "박준호",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "user-c@company.com",
    name: "이서연",
    isActive: true,
    passwordChangedAt: new Date(),
  },
  {
    companyEmail: "user-d@company.com",
    name: "최도윤",
    isActive: true,
    passwordChangedAt: null,
  },
];

const sampleRooms = [
  {
    name: "와이낫",
    capacity: 20,
    location: "8F East",
    description: "대형 전략 회의실",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "두잇",
    capacity: 10,
    location: "8F West",
    description: "중형 협업 회의실",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "쏘왓",
    capacity: 5,
    location: "9F East",
    description: "소형 집중 회의실",
    sortOrder: 3,
    isActive: true,
  },
];

const SAMPLE_COLOR_KEYS = ["rose", "mint", "sky", "amber", "violet"];
const DEFAULT_TEAM_SLUG = "default-team";
const DEFAULT_TEAM_NAME = "기본 팀";

function getKstParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function getKstDateKey(date) {
  const parts = getKstParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function toUtcIso(dateKey, time) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0));
}

function toReservationDate(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getTimeLabel(minutes) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad(hour)}:${pad(minute)}`;
}

function floorToHalfHour(totalMinutes) {
  return Math.floor(totalMinutes / 30) * 30;
}

function clamp(minutes, min, max) {
  return Math.min(Math.max(minutes, min), max);
}

function buildTodayScenario() {
  const now = new Date();
  const todayKey = getKstDateKey(now);
  const parts = getKstParts(now);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const startWindow = 6 * 60;
  const endWindow = 24 * 60;

  const nextHalfHour = clamp(floorToHalfHour(currentMinutes) + 30, startWindow + 30, endWindow - 30);
  const futureEditableStart = clamp(nextHalfHour + 60, startWindow + 60, endWindow - 150);
  const futureEditableEnd = futureEditableStart + 60;

  const pastLockedStart = clamp(floorToHalfHour(currentMinutes) - 60, startWindow, endWindow - 60);
  const pastLockedEnd = pastLockedStart + 60;

  const imminentStart = clamp(nextHalfHour, startWindow + 30, endWindow - 90);
  const imminentEnd = imminentStart + 60;

  const otherReservationStart = clamp(futureEditableEnd + 120, startWindow + 180, endWindow - 120);
  const otherReservationEnd = otherReservationStart + 60;

  return {
    todayKey,
    futureEditableStart: getTimeLabel(futureEditableStart),
    futureEditableEnd: getTimeLabel(futureEditableEnd),
    pastLockedStart: getTimeLabel(pastLockedStart),
    pastLockedEnd: getTimeLabel(pastLockedEnd),
    imminentStart: getTimeLabel(imminentStart),
    imminentEnd: getTimeLabel(imminentEnd),
    otherReservationStart: getTimeLabel(otherReservationStart),
    otherReservationEnd: getTimeLabel(otherReservationEnd),
  };
}

async function ensureDefaultTeam() {
  return prisma.team.upsert({
    where: {
      slug: DEFAULT_TEAM_SLUG,
    },
    update: {
      name: DEFAULT_TEAM_NAME,
      isDefault: true,
    },
    create: {
      name: DEFAULT_TEAM_NAME,
      slug: DEFAULT_TEAM_SLUG,
      isDefault: true,
    },
  });
}

async function upsertUsers(passwordHash) {
  const users = {};
  const defaultTeam = await ensureDefaultTeam();

  for (const user of sampleUsers) {
    users[user.companyEmail] = await prisma.user.upsert({
      where: {
        companyEmail: user.companyEmail,
      },
      update: {
        name: user.name,
        isActive: user.isActive,
        passwordHash,
        passwordChangedAt: user.passwordChangedAt,
        teamId: defaultTeam.id,
      },
      create: {
        companyEmail: user.companyEmail,
        name: user.name,
        isActive: user.isActive,
        passwordHash,
        passwordChangedAt: user.passwordChangedAt,
        teamId: defaultTeam.id,
      },
    });
  }

  return users;
}

async function upsertMeetingRooms() {
  const rooms = {};

  await prisma.meetingRoom.updateMany({
    data: {
      isActive: false,
    },
  });

  for (const room of sampleRooms) {
    rooms[room.name] = await prisma.meetingRoom.upsert({
      where: {
        name: room.name,
      },
      update: {
        capacity: room.capacity,
        location: room.location,
        description: room.description,
        sortOrder: room.sortOrder,
        isActive: room.isActive,
      },
      create: room,
    });
  }

  return rooms;
}

async function clearSampleReservations(userIds, roomIds) {
  await prisma.reservationParticipant.deleteMany({
    where: {
      OR: [
        {
          userId: {
            in: userIds,
          },
        },
        {
          reservation: {
            meetingRoomId: {
              in: roomIds,
            },
          },
        },
      ],
    },
  });

  await prisma.reservation.deleteMany({
    where: {
      OR: [
        {
          userId: {
            in: userIds,
          },
        },
        {
          meetingRoomId: {
            in: roomIds,
          },
        },
      ],
    },
  });

}

async function createReservation({
  userId,
  roomId,
  dateKey,
  startTime,
  endTime,
  purpose,
  status = ReservationStatus.active,
  colorKey = SAMPLE_COLOR_KEYS[0],
  participantUserIds = [],
}) {
  return prisma.reservation.create({
    data: {
      userId,
      meetingRoomId: roomId,
      reservationDate: toReservationDate(dateKey),
      startDatetime: toUtcIso(dateKey, startTime),
      endDatetime: toUtcIso(dateKey, endTime),
      colorKey,
      purpose,
      status,
      participants:
        participantUserIds.length > 0
          ? {
              create: participantUserIds.map((participantUserId) => ({
                userId: participantUserId,
              })),
            }
          : undefined,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, SALT_ROUNDS);
  const users = await upsertUsers(passwordHash);
  const rooms = await upsertMeetingRooms();

  await clearSampleReservations(
    Object.values(users).map((user) => user.id),
    Object.values(rooms).map((room) => room.id),
  );

  const todayScenario = buildTodayScenario();
  const tomorrowKey = addDays(todayScenario.todayKey, 1);
  const dayAfterTomorrowKey = addDays(todayScenario.todayKey, 2);

  await createReservation({
    userId: users["user-a@company.com"].id,
    roomId: rooms["두잇"].id,
    dateKey: todayScenario.todayKey,
    startTime: todayScenario.futureEditableStart,
    endTime: todayScenario.futureEditableEnd,
    purpose: "내 예약 편집 테스트",
    colorKey: SAMPLE_COLOR_KEYS[0],
  });

  await createReservation({
    userId: users["user-a@company.com"].id,
    roomId: rooms["쏘왓"].id,
    dateKey: todayScenario.todayKey,
    startTime: todayScenario.pastLockedStart,
    endTime: todayScenario.pastLockedEnd,
    purpose: "시작 시간 경과로 수정 불가",
    colorKey: SAMPLE_COLOR_KEYS[1],
  });

  await createReservation({
    userId: users["user-a@company.com"].id,
    roomId: rooms["와이낫"].id,
    dateKey: todayScenario.todayKey,
    startTime: todayScenario.imminentStart,
    endTime: todayScenario.imminentEnd,
    purpose: "시작 임박 예약",
    colorKey: SAMPLE_COLOR_KEYS[2],
  });

  await createReservation({
    userId: users["user-b@company.com"].id,
    roomId: rooms["와이낫"].id,
    dateKey: todayScenario.todayKey,
    startTime: todayScenario.otherReservationStart,
    endTime: todayScenario.otherReservationEnd,
    purpose: "남의 예약 상세 조회",
    colorKey: SAMPLE_COLOR_KEYS[3],
    participantUserIds: [
      users["user-c@company.com"].id,
      users["user-d@company.com"].id,
    ],
  });

  await createReservation({
    userId: users["user-b@company.com"].id,
    roomId: rooms["와이낫"].id,
    dateKey: tomorrowKey,
    startTime: "10:00",
    endTime: "11:00",
    purpose: "중복 예약 차단 기준 예약",
    colorKey: SAMPLE_COLOR_KEYS[4],
  });

  await createReservation({
    userId: users["user-a@company.com"].id,
    roomId: rooms["두잇"].id,
    dateKey: tomorrowKey,
    startTime: "10:00",
    endTime: "11:00",
    purpose: "다른 회의실 동시간대 허용",
    colorKey: SAMPLE_COLOR_KEYS[0],
  });

  await createReservation({
    userId: users["user-c@company.com"].id,
    roomId: rooms["쏘왓"].id,
    dateKey: tomorrowKey,
    startTime: "15:00",
    endTime: "16:00",
    purpose: "연속 예약 1",
    colorKey: SAMPLE_COLOR_KEYS[1],
  });

  await createReservation({
    userId: users["user-d@company.com"].id,
    roomId: rooms["쏘왓"].id,
    dateKey: tomorrowKey,
    startTime: "16:00",
    endTime: "17:00",
    purpose: "연속 예약 2",
    colorKey: SAMPLE_COLOR_KEYS[2],
  });

  await createReservation({
    userId: users["user-a@company.com"].id,
    roomId: rooms["와이낫"].id,
    dateKey: dayAfterTomorrowKey,
    startTime: "09:00",
    endTime: "10:00",
    purpose: "취소된 예약 예시",
    status: ReservationStatus.cancelled,
    colorKey: SAMPLE_COLOR_KEYS[3],
  });

  console.log("Seed completed.");
  console.log(`Initial password for all sample users: ${INITIAL_PASSWORD}`);
  console.log("Primary test account: user-a@company.com / Welcome123!");
  console.log(`Today (KST): ${todayScenario.todayKey}`);
  console.log(
    `Editable reservation for user-a: 두잇 ${todayScenario.futureEditableStart}-${todayScenario.futureEditableEnd}`,
  );
  console.log(
    `Locked reservation for user-a: 쏘왓 ${todayScenario.pastLockedStart}-${todayScenario.pastLockedEnd}`,
  );
  console.log(
    `Other user's reservation: 와이낫 ${todayScenario.otherReservationStart}-${todayScenario.otherReservationEnd}`,
  );
}

main()
  .catch(async (error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
