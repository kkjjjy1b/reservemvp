export const RESERVATION_COLOR_KEYS = [
  "rose",
  "mint",
  "sky",
  "amber",
  "violet",
] as const;

export type ReservationColorKey = (typeof RESERVATION_COLOR_KEYS)[number];

export function isReservationColorKey(value: string): value is ReservationColorKey {
  return RESERVATION_COLOR_KEYS.includes(value as ReservationColorKey);
}

export function getRandomReservationColorKey() {
  const index = Math.floor(Math.random() * RESERVATION_COLOR_KEYS.length);
  return RESERVATION_COLOR_KEYS[index];
}

export function getReservationColorTheme(colorKey: ReservationColorKey) {
  switch (colorKey) {
    case "rose":
      return {
        line: "bg-[#ea6f7a]",
        soft: "bg-[#fff6f7]",
        border: "border-[#f1d8dc]",
        text: "text-[#c85c68]",
      };
    case "mint":
      return {
        line: "bg-[#62c08b]",
        soft: "bg-[#f5fbf7]",
        border: "border-[#d8ebde]",
        text: "text-[#4d9f73]",
      };
    case "sky":
      return {
        line: "bg-[#6db2f2]",
        soft: "bg-[#f4f9ff]",
        border: "border-[#d8e7f5]",
        text: "text-[#4e8fcc]",
      };
    case "amber":
      return {
        line: "bg-[#e4b45f]",
        soft: "bg-[#fffaf1]",
        border: "border-[#f0e2c5]",
        text: "text-[#b8862a]",
      };
    case "violet":
      return {
        line: "bg-[#9b7ef3]",
        soft: "bg-[#f8f5ff]",
        border: "border-[#e3dcfb]",
        text: "text-[#7b61c8]",
      };
    default:
      return {
        line: "bg-[#6db2f2]",
        soft: "bg-[#f4f9ff]",
        border: "border-[#d8e7f5]",
        text: "text-[#4e8fcc]",
      };
  }
}

export function getStableRoomMeta(roomId: string) {
  const hash = Array.from(roomId).reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );

  return {
    colorKey: RESERVATION_COLOR_KEYS[hash % RESERVATION_COLOR_KEYS.length],
  };
}
