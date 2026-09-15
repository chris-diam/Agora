import { Router } from "express";
import * as interestsController from "../controllers/interests.controller";

const router = Router();

router.get("/", interestsController.getInterests);

export default router;
