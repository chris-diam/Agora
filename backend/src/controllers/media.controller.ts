import { Request, Response } from "express";
import * as mediaService from "../services/media.service";
import { asyncHandler } from "../utils/asyncHandler";

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const asset = await mediaService.getMediaAsset(req.params.id);
  // Content-addressed by id and never mutated — safe to cache forever.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Type", asset.mimeType);
  // Prisma returns Bytes as a plain Uint8Array, not a real Buffer —
  // res.send() only sends raw binary for an actual Buffer, and otherwise
  // silently falls back to JSON-serializing it as a numeric-keyed object.
  res.send(Buffer.from(asset.data));
});
