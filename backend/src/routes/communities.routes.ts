import { Router } from "express";
import * as communitiesController from "../controllers/communities.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCommunitySchema, listCommunitiesQuerySchema } from "../validators/communities.validators";

const router = Router();

router.get("/", validate(listCommunitiesQuerySchema), optionalAuth, communitiesController.listCommunities);
router.post("/", requireAuth, validate(createCommunitySchema), communitiesController.createCommunity);
router.get("/:id", optionalAuth, communitiesController.getCommunity);
router.post("/:id/join", requireAuth, communitiesController.joinCommunity);
router.delete("/:id/join", requireAuth, communitiesController.leaveCommunity);

export default router;
