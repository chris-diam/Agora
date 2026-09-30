import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Login/registration itself happens entirely on Keycloak's hosted pages —
// this API's job is just to hand back the local profile for whichever
// Keycloak-authenticated user is making the request (see requireAuth /
// keycloak.service.ts for how that user gets linked/provisioned).
router.get("/me", requireAuth, authController.me);

export default router;
