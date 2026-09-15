import { Router } from "express";
import * as messagesController from "../controllers/messages.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { sendMessageSchema } from "../validators/messages.validators";

const router = Router();

router.use(requireAuth);

// Fixed-segment routes registered before the "/:userId" ones.
router.get("/unread-count", messagesController.unreadCount);
router.get("/", messagesController.listConversations);

router.get("/:userId", messagesController.getConversation);
router.post("/:userId", validate(sendMessageSchema), messagesController.sendMessage);

export default router;
