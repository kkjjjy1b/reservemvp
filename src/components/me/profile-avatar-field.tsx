"use client";

import { ProfileImageField } from "@/components/ui/profile-image-field";
import type { CurrentUserProfile } from "@/lib/account/types";

type ProfileAvatarFieldProps = {
  profile: Pick<CurrentUserProfile, "name" | "companyEmail" | "avatarUrl" | "avatarSeed">;
  previewUrl?: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
};

export function ProfileAvatarField({
  profile,
  previewUrl = null,
  disabled = false,
  onFileChange,
}: ProfileAvatarFieldProps) {
  return (
    <ProfileImageField
      name={profile.name}
      currentImageUrl={previewUrl ?? profile.avatarUrl}
      disabled={disabled}
      accept="image/png,image/jpeg,image/webp,image/gif"
      onFileSelect={onFileChange}
      onClear={previewUrl ? () => onFileChange(null) : undefined}
      helperText="이미지를 업로드하지 않으면 이름 기반 기본 아바타가 표시됩니다."
    />
  );
}
