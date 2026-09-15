import { Router } from "express";
import * as notificationsController from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Notifications are inherently personal — every route here requires auth.
router.use(requireAuth);

router.get("/", notificationsController.list);
router.get("/unread-count", notificationsController.unreadCount);
router.post("/read-all", notificationsController.readAll);

export default router;
