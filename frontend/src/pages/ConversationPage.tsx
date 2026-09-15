import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useChatDock } from "../context/SocketContext";

// A direct link to /messages/:userId (bookmarked, shared, or a stale
// internal link) opens that conversation in the floating chat dock and
// lands on the inbox — messaging now happens as a popup everywhere, not as
// a separate full-page thread view.
export function ConversationPage() {
  const { userId } = useParams<{ userId: string }>();
  const { openChat } = useChatDock();

  useEffect(() => {
    if (userId) openChat(userId);
  }, [userId, openChat]);

  return <Navigate to="/messages" replace />;
}
