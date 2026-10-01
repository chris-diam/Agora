import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema } from "../validators/auth.validators";

const router = Router();

// Login itself is a direct browser->Keycloak call (Resource Owner Password
// Credentials grant against the kyma-web public client) — this API never
// sees a password for login. Registration has no equivalent self-service
// grant, so it goes through our own backend using a scoped service-account
// client (see keycloak-admin.service.ts), not the realm admin login.
router.post("/register", validate(registerSchema), authController.register);
router.get("/me", requireAuth, authController.me);

export default router;
