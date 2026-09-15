import { Router } from "express";
import * as commentsController from "../controllers/comments.controller";
import * as postsController from "../controllers/posts.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCommentSchema } from "../validators/comments.validators";
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from "../validators/posts.validators";

const router = Router();

router.get("/", validate(listPostsQuerySchema), optionalAuth, postsController.listPosts);
router.post("/", requireAuth, validate(createPostSchema), postsController.createPost);
router.get("/:id", optionalAuth, postsController.getPost);
router.patch("/:id", requireAuth, validate(updatePostSchema), postsController.updatePost);
router.delete("/:id", requireAuth, postsController.deletePost);

router.post("/:id/like", requireAuth, postsController.likePost);
router.delete("/:id/like", requireAuth, postsController.unlikePost);

router.get("/:id/comments", commentsController.getComments);
router.post("/:id/comments", requireAuth, validate(createCommentSchema), commentsController.createComment);

export default router;
