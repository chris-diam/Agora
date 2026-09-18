import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const MEDIA_PATH_PREFIX = "/api/media/";

export const createMediaAsset = async (buffer: Buffer, mimeType: string) => {
  // Buffer's backing ArrayBufferLike can technically be a SharedArrayBuffer,
  // which Prisma's Bytes type doesn't accept — Uint8Array.from copies into a
  // plain ArrayBuffer-backed array to satisfy that.
  const asset = await prisma.mediaAsset.create({ data: { data: Uint8Array.from(buffer), mimeType } });
  return `${MEDIA_PATH_PREFIX}${asset.id}`;
};

export const getMediaAsset = async (id: string) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new AppError("Media not found", 404);
  return asset;
};

// Old avatars/post media stored a raw "/uploads/..." disk path; anything
// under our own "/api/media/<id>" prefix is a row we can clean up when it's
// replaced. Best-effort — never blocks the caller on failure.
export const deleteMediaAssetByUrl = async (url: string | null | undefined) => {
  if (!url?.startsWith(MEDIA_PATH_PREFIX)) return;
  const id = url.slice(MEDIA_PATH_PREFIX.length);
  await prisma.mediaAsset.delete({ where: { id } }).catch(() => {});
};
