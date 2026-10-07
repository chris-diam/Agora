import multer from "multer";
import { AppError } from "../utils/AppError";

// Buffered in memory, not written to disk — the handler persists the bytes
// into the MediaAsset table (see media.service.ts). Render's free-tier
// filesystem is ephemeral and gets wiped on every redeploy, which is why
// disk storage silently lost every avatar/post image after a deploy.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
// Images are resized/recompressed server-side before storage (see
// media.service.ts), so these caps are about bounding the raw upload's
// memory footprint, not the final stored size — kept generous enough for
// an un-cropped modern phone photo rather than forcing people to
// pre-shrink images themselves.
const AVATAR_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — a square crop never needs more.
const EVENT_IMAGE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Avatar must be a JPEG, PNG, WebP, or GIF image", 400));
      return;
    }
    callback(null, true);
  },
}).single("avatar");

export const uploadEventImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EVENT_IMAGE_MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Event photo must be a JPEG, PNG, WebP, or GIF image", 400));
      return;
    }
    callback(null, true);
  },
}).single("image");

// Post attachments: images or short videos.
const ALLOWED_POST_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
// Images get resized/recompressed server-side before storage (see
// media.service.ts) so this limit is really about capping uncompressed
// video, which passes through untouched — kept well under the Render
// free-tier instance's total RAM since multer buffers the whole file in
// memory before this handler ever runs.
const MAX_POST_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadPostMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_POST_MEDIA_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_POST_MEDIA_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Post media must be a JPEG, PNG, WebP, or GIF image, or an MP4, WebM, or MOV video", 400));
      return;
    }
    callback(null, true);
  },
}).single("media");
