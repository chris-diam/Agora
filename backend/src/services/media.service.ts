import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const MEDIA_PATH_PREFIX = "/api/media/";

// Long-edge cap for stored images — generous enough for a full-bleed card
// or detail view, but far smaller than a modern phone photo (routinely
// 3000-4000px). This is the single biggest lever on this app's Render
// free-tier memory pressure: every image is both buffered in full by
// multer on upload AND re-buffered in full on every single GET (see
// getMedia below, which has no streaming path), so an uncompressed photo
// costs memory on every view, not just once. Render's OOM auto-restart
// ("Web Service exceeded its memory limit") traced back to this — large
// originals were being held in memory repeatedly across the feed, events,
// and profile pages all requesting images concurrently.
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 82;

const compressIfImage = async (buffer: Buffer, mimeType: string): Promise<{ data: Buffer; mimeType: string }> => {
  // GIFs skip this pipeline — sharp's default output collapses an animated
  // GIF to its first frame, which would silently break animated uploads.
  if (!mimeType.startsWith("image/") || mimeType === "image/gif") {
    return { data: buffer, mimeType };
  }
  try {
    let pipeline = sharp(buffer)
      .rotate() // bakes in EXIF orientation before the metadata is stripped
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true });
    pipeline =
      mimeType === "image/png"
        ? pipeline.png({ compressionLevel: 9 })
        : mimeType === "image/webp"
          ? pipeline.webp({ quality: IMAGE_QUALITY })
          : pipeline.jpeg({ quality: IMAGE_QUALITY });
    const data = await pipeline.toBuffer();
    return { data, mimeType };
  } catch {
    // Corrupt/unsupported file — store the original rather than failing
    // the whole upload over a thumbnail optimization.
    return { data: buffer, mimeType };
  }
};

export const createMediaAsset = async (buffer: Buffer, mimeType: string) => {
  const compressed = await compressIfImage(buffer, mimeType);
  // Buffer's backing ArrayBufferLike can technically be a SharedArrayBuffer,
  // which Prisma's Bytes type doesn't accept — Uint8Array.from copies into a
  // plain ArrayBuffer-backed array to satisfy that.
  const asset = await prisma.mediaAsset.create({
    data: { data: Uint8Array.from(compressed.data), mimeType: compressed.mimeType },
  });
  return `${MEDIA_PATH_PREFIX}${asset.id}`;
};

// Downloads an external image (e.g. a Google account's profile photo) once
// and re-hosts it as our own MediaAsset, instead of storing the external
// URL directly. Hotlinking it forever is fragile: Google's photo CDN is
// rate-limited (seen firsthand as a 429 on repeated loads) and the URL can
// also expire/rotate independently of anything we do. Returns null on any
// failure — the caller falls back to no avatar rather than blocking signup.
export const createMediaAssetFromUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get("content-type") ?? "image/jpeg";
    return await createMediaAsset(buffer, mimeType);
  } catch {
    return null;
  }
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
