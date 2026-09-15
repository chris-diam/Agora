import { Router } from "express";
import authRoutes from "./auth.routes";
import commentsRoutes from "./comments.routes";
import communitiesRoutes from "./communities.routes";
import eventsRoutes from "./events.routes";
import feedRoutes from "./feed.routes";
import friendsRoutes from "./friends.routes";
import interestsRoutes from "./interests.routes";
import messagesRoutes from "./messages.routes";
import notificationsRoutes from "./notifications.routes";
import postsRoutes from "./posts.routes";
import searchRoutes from "./search.routes";
import usersRoutes from "./users.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/interests", interestsRoutes);
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/events", eventsRoutes);
router.use("/communities", communitiesRoutes);
router.use("/feed", feedRoutes);
router.use("/search", searchRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/friends", friendsRoutes);
router.use("/messages", messagesRoutes);

export default router;
