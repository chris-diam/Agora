import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/notFound.middleware";
import routes from "./routes";

const app = express();

app.use(helmet());
// CORS_ORIGIN unset (the default, e.g. in local dev) reflects whatever
// origin made the request — permissive, matching plain cors()'s default.
// In production, set it to the deployed frontend's exact origin.
app.use(cors({ origin: env.CORS_ORIGIN ?? true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// Uploaded avatars/post media are served from GET /api/media/:id (see
// media.routes.ts) — they're stored in the database, not on disk, so there's
// no static file mount here.
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
