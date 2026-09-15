import { Router } from "express";
import * as friendsController from "../controllers/friends.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", friendsController.list);

export default router;
