import { Router } from "express";
import { env } from "../config/env";
import { sendUpcomingEventsDigest } from "../services/newsletter.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

const router = Router();

// Triggered by an external scheduler (a free cron-ping service, or a
// scheduled GitHub Actions workflow) rather than a normal authenticated
// user — hence the shared-secret header instead of requireAuth. See
// env.ts's NEWSLETTER_CRON_SECRET comment.
router.post(
  "/send-digest",
  asyncHandler(async (req, res) => {
    if (!env.NEWSLETTER_CRON_SECRET || req.headers["x-cron-secret"] !== env.NEWSLETTER_CRON_SECRET) {
      throw new AppError("Not authorized", 401);
    }
    const result = await sendUpcomingEventsDigest();
    return sendSuccess(res, result);
  }),
);

export default router;
