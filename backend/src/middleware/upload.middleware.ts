import multer from "multer";
import { AppError } from "../utils/AppError";

// Buffered in memory, not written to disk — the handler persists the bytes
// into the MediaAsset table (see media.service.ts). Render's free-tier
// filesystem is ephemeral and gets wiped on every redeploy, which is why
// disk storage silently lost every avatar/post image after a deploy.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
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
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
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
const MAX_POST_MEDIA_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — bigger than an avatar since this covers short video clips too.

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
