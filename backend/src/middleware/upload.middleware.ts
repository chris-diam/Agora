import { randomUUID } from "crypto";
import path from "path";
import multer from "multer";
import { AppError } from "../utils/AppError";

// Local disk storage — the pragmatic MVP choice (no S3/cloud storage
// credentials to manage yet). AVATAR_DIR is served statically at /uploads
// (see app.ts).
export const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, AVATAR_DIR),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    callback(null, `${randomUUID()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Avatar must be a JPEG, PNG, WebP, or GIF image", 400));
      return;
    }
    callback(null, true);
  },
}).single("avatar");

// Post attachments: images or short videos, served the same way as
// avatars. POST_MEDIA_DIR is served statically at /uploads (see app.ts).
export const POST_MEDIA_DIR = path.join(__dirname, "..", "..", "uploads", "posts");

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

const postMediaStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, POST_MEDIA_DIR),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    callback(null, `${randomUUID()}${ext}`);
  },
});

export const uploadPostMedia = multer({
  storage: postMediaStorage,
  limits: { fileSize: MAX_POST_MEDIA_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_POST_MEDIA_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError("Post media must be a JPEG, PNG, WebP, or GIF image, or an MP4, WebM, or MOV video", 400));
      return;
    }
    callback(null, true);
  },
}).single("media");
