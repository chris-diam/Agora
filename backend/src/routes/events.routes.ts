import { Router } from "express";
import * as eventsController from "../controllers/events.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createEventSchema,
  listEventsQuerySchema,
  setAttendanceSchema,
  updateEventSchema,
} from "../validators/events.validators";

const router = Router();

router.get("/", validate(listEventsQuerySchema), optionalAuth, eventsController.listEvents);
router.post("/", requireAuth, validate(createEventSchema), eventsController.createEvent);
router.get("/:id", optionalAuth, eventsController.getEvent);
router.patch("/:id", requireAuth, validate(updateEventSchema), eventsController.updateEvent);
router.delete("/:id", requireAuth, eventsController.deleteEvent);

router.post("/:id/attendance", requireAuth, validate(setAttendanceSchema), eventsController.setAttendance);
router.delete("/:id/attendance", requireAuth, eventsController.removeAttendance);

export default router;
