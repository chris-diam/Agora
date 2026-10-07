import { Router } from "express";
import * as groupChatsController from "../controllers/groupChats.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createGroupChatSchema, sendGroupMessageSchema } from "../validators/groupChats.validators";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createGroupChatSchema), groupChatsController.createGroupChat);
router.get("/", groupChatsController.listGroupChats);
router.get("/:id", groupChatsController.getGroupChat);
router.get("/:id/messages", groupChatsController.getGroupMessages);
router.post("/:id/messages", validate(sendGroupMessageSchema), groupChatsController.sendGroupMessage);

export default router;
