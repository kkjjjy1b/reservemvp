import type { ProfileIdentity } from "@/lib/account/types";
import type { ReservationPerson } from "@/lib/reservations/types";

type AvatarPalette = {
  bg: string;
  border: string;
  text: string;
};

const AVATAR_PALETTES: AvatarPalette[] = [
  {
    bg: "bg-[#f3efe8]",
    border: "border-[#e0d5c7]",
    text: "text-[#7a5c3a]",
  },
  {
    bg: "bg-[#eef5f0]",
    border: "border-[#d4e5da]",
    text: "text-[#3f6a4b]",
  },
  {
    bg: "bg-[#eef3fb]",
    border: "border-[#d7e1f3]",
    text: "text-[#476284]",
  },
  {
    bg: "bg-[#f8eef7]",
    border: "border-[#ead7e8]",
    text: "text-[#7f4f76]",
  },
  {
    bg: "bg-[#fff3e9]",
    border: "border-[#f1dfcc]",
    text: "text-[#8b5d2f]",
  },
];

type AvatarSource = Pick<ProfileIdentity, "name" | "avatarUrl" | "avatarSeed"> &
  Partial<Pick<ProfileIdentity, "companyEmail">> &
  Partial<Pick<ReservationPerson, "id">>;

export function getAvatarInitials(name: string | null | undefined) {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return "NA";
  }

  const compact = trimmedName.replace(/\s+/g, "");

  if (compact.length <= 2) {
    return compact.toUpperCase();
  }

  return compact.slice(0, 2).toUpperCase();
}

function getSeedValue(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getAvatarPalette(source: AvatarSource) {
  const seed =
    source.avatarSeed ??
    source.id ??
    source.companyEmail ??
    source.name ??
    "reserve-default-avatar";

  return AVATAR_PALETTES[getSeedValue(seed) % AVATAR_PALETTES.length];
}

export function getAvatarModel(source: AvatarSource) {
  return {
    initials: getAvatarInitials(source.name),
    palette: getAvatarPalette(source),
    imageUrl: source.avatarUrl ?? null,
  };
}
