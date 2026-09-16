import { Router } from "express";
import * as interestsController from "../controllers/interests.controller";
import * as usersController from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { uploadAvatar } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import { setInterestsSchema } from "../validators/interests.validators";
import { updateProfileSchema } from "../validators/users.validators";

const router = Router();

// Fixed-segment routes ("/me", "/me/interests", "/me/avatar") are
// registered before the "/:id" param route so they can't be shadowed by it.
router.patch("/me", requireAuth, validate(updateProfileSchema), usersController.updateMe);
router.patch(
  "/me/interests",
  requireAuth,
  validate(setInterestsSchema),
  interestsController.updateMyInterests
);
router.post("/me/avatar", requireAuth, uploadAvatar, usersController.uploadAvatar);

// Fixed-segment "/artists" is likewise registered before "/:id" so it
// can't be shadowed by the param route.
router.get("/artists", usersController.listArtists);

router.get("/:id", optionalAuth, usersController.getUser);
router.post("/:id/follow", requireAuth, usersController.follow);
router.delete("/:id/follow", requireAuth, usersController.unfollow);
router.get("/:id/followers", usersController.getFollowers);
router.get("/:id/following", usersController.getFollowing);

export default router;
