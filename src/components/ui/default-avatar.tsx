import type { HTMLAttributes } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

type DefaultAvatarProps = {
  name: string;
  seed?: string;
  size?: AvatarSize;
  className?: string;
  title?: string;
} & HTMLAttributes<HTMLDivElement>;

const SIZE_CLASS_NAMES: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-base",
};

const AVATAR_THEMES = [
  "bg-[#f3efe7] text-[#6b5a44] ring-[#e9dfcf]",
  "bg-[#eef4ef] text-[#4e7059] ring-[#dde8de]",
  "bg-[#eef2f8] text-[#51627e] ring-[#dce3ee]",
  "bg-[#f7eeee] text-[#7d555c] ring-[#ecdada]",
  "bg-[#f0eef8] text-[#625887] ring-[#e0dbef]",
  "bg-[#f7f2e6] text-[#7a6234] ring-[#ebdfc1]",
  "bg-[#eef7f6] text-[#4d6f6b] ring-[#dcecea]",
  "bg-[#f4f1ea] text-[#6d6356] ring-[#e5ddd0]",
];

export type { AvatarSize };

export function getAvatarInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "?";
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function getAvatarTheme(seed: string) {
  const hash = seed
    .split("")
    .reduce((accumulator, character) => {
      return (accumulator * 33 + character.charCodeAt(0)) >>> 0;
    }, 5381);

  return AVATAR_THEMES[hash % AVATAR_THEMES.length];
}

export function DefaultAvatar({
  name,
  seed,
  size = "md",
  className = "",
  title,
  ...rest
}: DefaultAvatarProps) {
  const themeClassName = getAvatarTheme(seed ?? name);
  const initials = getAvatarInitials(name);

  return (
    <div
      {...rest}
      title={title ?? name}
      aria-label={title ?? name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-black/5 font-semibold shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] ${SIZE_CLASS_NAMES[size]} ${themeClassName} ${className}`}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );
}
