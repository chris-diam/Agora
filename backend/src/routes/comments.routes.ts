import { Router } from "express";
import * as commentsController from "../controllers/comments.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Nested comment creation/listing lives under /posts/:id/comments
// (posts.routes.ts) — this top-level route only exists for deleting a
// comment by its own id, since a comment isn't addressable any other way.
router.delete("/:id", requireAuth, commentsController.deleteComment);

export default router;
