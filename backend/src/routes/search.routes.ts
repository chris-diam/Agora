import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { validate } from "../middleware/validate.middleware";
import { searchQuerySchema } from "../validators/search.validators";

const router = Router();

router.get("/", validate(searchQuerySchema), searchController.search);

export default router;
