import { del, put } from "@vercel/blob";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAvatarStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function validateAvatarFile(file: File) {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    return "PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "프로필 이미지는 5MB 이하만 업로드할 수 있습니다.";
  }

  return null;
}

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim().toLowerCase();
  const replaced = trimmed.replace(/[^a-z0-9._-]+/g, "-");
  return replaced.replace(/-+/g, "-").replace(/^-|-$/g, "") || "avatar";
}

export async function uploadAvatarFile(params: {
  userId: string;
  file: File;
}) {
  const safeFilename = sanitizeFilename(params.file.name);
  const pathname = `avatars/${params.userId}/${Date.now()}-${safeFilename}`;

  return put(pathname, params.file, {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function deleteAvatarFile(storageKey: string | null | undefined) {
  if (!storageKey) {
    return;
  }

  await del(storageKey);
}
