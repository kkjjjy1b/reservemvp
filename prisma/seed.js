const { PrismaClient, ReservationStatus } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const INITIAL_PASSWORD = "1234";
const SALT_ROUNDS = 12;
const TIME_ZONE = "Asia/Seoul";

const sampleUsers = [
  {
    companyEmail: "test@cheongnim.com",
    name: "테스트 계정",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "sjlee@cheongnim.com",
    name: "이승진",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "sjlee2262@cheongnim.com",
    name: "이승재",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "jhkim@cheongnim.com",
    name: "김준호",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "shlee@cheongnim.com",
    name: "이상헌",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "hjma@cheongnim.com",
    name: "마형준",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "wjjeong@cheongnim.com",
    name: "정완주",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "thkim@cheongnim.com",
    name: "김태현",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "bkkim@cheongnim.com",
    name: "김보경",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "sghan@cheongnim.com",
    name: "한슬기",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "hhyu@cheongnim.com",
    name: "유환희",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "jhchoi@cheongnim.com",
    name: "최장혁",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "shjeon@cheongnim.com",
    name: "전서현",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "syyoon@cheongnim.com",
    name: "윤수연",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "yjkang@cheongnim.com",
    name: "강예지",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "ihkim@cheongnim.com",
    name: "김인혜",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "smchoi@cheongnim.com",
    name: "최소민",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "hgbang@cheongnim.com",
    name: "방현경",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "yngal@cheongnim.com",
    name: "갈유나",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "jykim@cheongnim.com",
    name: "김정연",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "jjkim@cheongnim.com",
    name: "김정주",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "dhkim@cheongnim.com",
    name: "김동현",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "shyoon@cheongnim.com",
    name: "윤상현",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "shkim@cheongnim.com",
    name: "김성헌",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "hkoh@cheongnim.com",
    name: "오현경",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "yhchoi@cheongnim.com",
    name: "최용환",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "bnlee@cheongnim.com",
    name: "이빛나",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "jgkim@cheongnim.com",
    name: "김정길",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "hmjeon@cheongnim.com",
    name: "전현민",
    isActive: true,
    passwordChangedAt: null,
  },
  {
    companyEmail: "cijo@cheongnim.com",
    name: "조찬익",
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

async function main() {
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, SALT_ROUNDS);
  const users = await upsertUsers(passwordHash);
  const rooms = await upsertMeetingRooms();

  await clearSampleReservations(
    Object.values(users).map((user) => user.id),
    Object.values(rooms).map((room) => room.id),
  );

  console.log("Seed completed.");
  console.log(`Initial password for all seeded users: ${INITIAL_PASSWORD}`);
  console.log("Primary test account: test@cheongnim.com / 1234");
  console.log(`Seeded users: ${Object.keys(users).length}`);
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
