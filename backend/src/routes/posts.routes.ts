import { Router } from "express";
import * as commentsController from "../controllers/comments.controller";
import * as postsController from "../controllers/posts.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { uploadPostMedia } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCommentSchema } from "../validators/comments.validators";
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from "../validators/posts.validators";

const router = Router();

router.get("/", validate(listPostsQuerySchema), optionalAuth, postsController.listPosts);
// uploadPostMedia runs first so an optional multipart "media" file is
// parsed into req.file before validation reads req.body — it no-ops for
// plain JSON requests (no file, no link) since multer only intercepts
// multipart/form-data content types.
router.post("/", requireAuth, uploadPostMedia, validate(createPostSchema), postsController.createPost);

// Fixed-segment "/saved" is registered before "/:id" so it can't be
// shadowed by the param route.
router.get("/saved", requireAuth, postsController.listSavedPosts);

router.get("/:id", optionalAuth, postsController.getPost);
router.patch("/:id", requireAuth, validate(updatePostSchema), postsController.updatePost);
router.delete("/:id", requireAuth, postsController.deletePost);

router.post("/:id/like", requireAuth, postsController.likePost);
router.delete("/:id/like", requireAuth, postsController.unlikePost);

router.post("/:id/save", requireAuth, postsController.savePost);
router.delete("/:id/save", requireAuth, postsController.unsavePost);

router.get("/:id/comments", commentsController.getComments);
router.post("/:id/comments", requireAuth, validate(createCommentSchema), commentsController.createComment);

export default router;
