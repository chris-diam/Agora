import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
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

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    setHeaders: (res) => {
      // Helmet's default Cross-Origin-Resource-Policy (same-origin) would
      // otherwise block the frontend (a different origin in dev/prod) from
      // loading these images in an <img> tag.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
