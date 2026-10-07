import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSocket, type IncomingNotification } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch, resolveMediaUrl } from "../lib/api";
import { formatRelativeTime, isRecent } from "../lib/time";
import { fonts, type Palette } from "../lib/theme";
import { Avatar } from "./Avatar";

interface PostAuthor {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface PostCardPost {
  id: string;
  content: string;
  // Only set for article-style posts (written via the News category's
  // headline field) — presence of a title is what picks the headline
  // treatment below over a plain post.
  title?: string | null;
  mediaUrl: string | null;
  category: string;
  city: string | null;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  likedByViewer?: boolean;
}

interface CommentItem {
  id: string;
  content: string;
  author: PostAuthor;
}

const CATEGORY_LABELS: Record<string, string> = {
  LOCAL_NEWS: "Local news",
  NATIONAL_NEWS: "National news",
  WORLD_NEWS: "World news",
  MUSIC: "Music",
  ART: "Art",
  CULTURE: "Culture",
  THEATRE: "Theatre",
  CINEMA: "Cinema",
  TECHNOLOGY: "Technology",
  SCIENCE: "Science",
  GENERAL: "General",
};

export function PostCard({ post, showReason, reason }: { post: PostCardPost; showReason?: boolean; reason?: string }) {
  const { colors } = useTheme();
  const { socket } = useSocket();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [liked, setLiked] = useState(Boolean(post.likedByViewer));
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");

  // Only the post's author ever receives a "notification:new" for it (see
  // notifications.service.ts), so a card the viewer owns updates its own
  // counts live when someone else likes/comments — a card someone else
  // posted stays as-is until the viewer reloads the feed.
  useEffect(() => {
    if (!socket) return;
    const handler = (notification: IncomingNotification) => {
      if (notification.postId !== post.id) return;
      if (notification.type === "LIKE") setLikesCount((count) => count + 1);
      if (notification.type === "COMMENT") setCommentsCount((count) => count + 1);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, post.id]);

  const goToProfile = () => router.push({ pathname: "/user/[userId]", params: { userId: post.author.id } });

  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));
    try {
      await apiFetch(`/posts/${post.id}/like`, { method: nextLiked ? "POST" : "DELETE" });
    } catch {
      setLiked(!nextLiked);
      setLikesCount((count) => count + (nextLiked ? -1 : 1));
    } finally {
      setIsLiking(false);
    }
  };

  const toggleComments = async () => {
    const next = !commentsExpanded;
    setCommentsExpanded(next);
    if (next && comments === null) {
      setIsLoadingComments(true);
      try {
        const data = await apiFetch<CommentItem[]>(`/posts/${post.id}/comments`);
        setComments(data);
      } catch {
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const submitComment = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    setCommentDraft("");
    try {
      const created = await apiFetch<CommentItem>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setComments((previous) => [...(previous ?? []), created]);
      setCommentsCount((count) => count + 1);
    } catch {
      setCommentDraft(content);
    }
  };

  const imageUrl = resolveMediaUrl(post.mediaUrl);
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;
  const badgeLabel = [isRecent(post.createdAt) ? "LIVE" : null, categoryLabel, post.city]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return (
    <View style={styles.card}>
      {imageUrl && (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: imageUrl }} style={styles.media} />
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.authorRow} onPress={goToProfile}>
            <Avatar name={post.author.displayName} imageUrl={post.author.profileImageUrl} size={34} />
            <View>
              <Text style={styles.author}>{post.author.displayName}</Text>
              {!imageUrl && <Text style={styles.timeInline}>{formatRelativeTime(post.createdAt)}</Text>}
            </View>
          </TouchableOpacity>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{badgeLabel}</Text>
          </View>
        </View>

        {showReason && reason && <Text style={styles.reason}>{reason}</Text>}

        {Boolean(post.title) && <Text style={styles.headline}>{post.title}</Text>}
        <Text style={styles.content}>{post.content}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={19} color={liked ? colors.agora : colors.agoraMuted} />
            <Text style={[styles.actionText, liked && { color: colors.agora }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleComments}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.agoraMuted} />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>
        </View>

        {commentsExpanded && (
          <View style={styles.commentsBlock}>
            {isLoadingComments && <ActivityIndicator color={colors.agora} style={{ marginVertical: 8 }} />}
            {comments?.map((comment) => (
              <TouchableOpacity
                key={comment.id}
                style={styles.commentRow}
                onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: comment.author.id } })}
              >
                <Avatar name={comment.author.displayName} imageUrl={comment.author.profileImageUrl} size={24} />
                <Text style={styles.commentText}>
                  <Text style={styles.commentAuthor}>{comment.author.displayName} </Text>
                  {comment.content}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment…"
                placeholderTextColor={colors.agoraMuted}
                value={commentDraft}
                onChangeText={setCommentDraft}
              />
              <TouchableOpacity onPress={submitComment}>
                <Text style={styles.postCommentButton}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraSurface,
      borderRadius: 20,
      overflow: "hidden",
      marginHorizontal: 16,
      marginBottom: 16,
    },
    mediaWrap: { width: "100%", aspectRatio: 16 / 11 },
    media: { width: "100%", height: "100%" },
    timeBadge: {
      position: "absolute",
      left: 12,
      bottom: 12,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    timeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
    body: { padding: 14, gap: 8 },
    topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
    author: { fontFamily: fonts.body, fontWeight: "600", fontSize: 14, color: colors.agoraText },
    timeInline: { fontSize: 11, color: colors.agoraMuted },
    categoryPill: {
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    categoryPillText: { fontSize: 9, fontWeight: "700", color: colors.agoraDim, letterSpacing: 0.4 },
    reason: { fontSize: 12, color: colors.agoraDim },
    headline: { fontFamily: fonts.body, fontWeight: "700", fontSize: 20, lineHeight: 26, color: colors.agoraText, marginBottom: 2 },
    content: { fontFamily: fonts.body, fontSize: 19, lineHeight: 25, color: colors.agoraText },
    actionsRow: { flexDirection: "row", gap: 18, marginTop: 2 },
    actionButton: { flexDirection: "row", alignItems: "center", gap: 5 },
    actionText: { fontSize: 13, color: colors.agoraMuted },
    commentsBlock: {
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.agoraBorder,
      gap: 8,
    },
    commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    commentText: { flex: 1, fontSize: 13, color: colors.agoraText, lineHeight: 18 },
    commentAuthor: { fontWeight: "700" },
    commentInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.agoraBorder,
      backgroundColor: colors.agoraBg,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      color: colors.agoraText,
      fontSize: 13,
    },
    postCommentButton: { color: colors.agora, fontWeight: "700", fontSize: 13 },
  });
