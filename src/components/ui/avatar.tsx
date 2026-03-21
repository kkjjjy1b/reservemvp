import { type HTMLAttributes } from "react";

import {
  DefaultAvatar,
  type AvatarSize,
} from "@/components/ui/default-avatar";

export type AvatarIdentity = {
  name: string;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
};

type AvatarProps = AvatarIdentity & {
  size?: AvatarSize;
  className?: string;
  title?: string;
  imageClassName?: string;
} & HTMLAttributes<HTMLDivElement>;

const SIZE_CLASS_NAMES: Record<AvatarSize, string> = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
};

export function Avatar({
  name,
  avatarUrl,
  avatarSeed,
  size = "md",
  className = "",
  title,
  imageClassName = "",
  ...rest
}: AvatarProps) {
  const sizeClassName = SIZE_CLASS_NAMES[size];

  if (!avatarUrl) {
    return (
      <DefaultAvatar
        name={name}
        seed={avatarSeed ?? name}
        size={size}
        className={className}
        title={title}
        {...rest}
      />
    );
  }

  return (
    <div
      {...rest}
      title={title ?? name}
      aria-label={title ?? name}
      className={`inline-flex shrink-0 overflow-hidden rounded-full border border-black/5 bg-white ${sizeClassName} ${className}`}
    >
      <img
        src={avatarUrl}
        alt={title ?? name}
        className={`h-full w-full object-cover ${imageClassName}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
