import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { sendError } from "../utils/apiResponse";

/**
 * Validates req.{body,query,params} against a Zod schema shaped as
 * z.object({ body: ..., query: ..., params: ... }). Domain-specific schemas
 * live in src/validators/*; this is just the wiring, used from phase 3 on.
 */
export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        return sendError(res, message, 400);
      }
      next(err);
    }
  };
