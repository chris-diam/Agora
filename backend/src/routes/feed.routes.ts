import { Router } from "express";
import * as feedController from "../controllers/feed.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";

const router = Router();

// following/interests/local are inherently personalized and require auth.
// chronological stays public (optionalAuth only so a logged-in caller still
// gets a correct likedByViewer flag on each post).
router.get("/following", requireAuth, feedController.getFollowingFeed);
router.get("/chronological", optionalAuth, feedController.getChronologicalFeed);
router.get("/interests", requireAuth, feedController.getInterestFeed);
router.get("/local", requireAuth, feedController.getLocalFeed);

export default router;
