// Mirrors the backend's response shapes (backend/src/services/*.ts). Kept
// as one shared file since the frontend is a single small app for now.

export type PostCategory =
  | "LOCAL_NEWS"
  | "NATIONAL_NEWS"
  | "WORLD_NEWS"
  | "MUSIC"
  | "ART"
  | "CULTURE"
  | "THEATRE"
  | "CINEMA"
  | "TECHNOLOGY"
  | "SCIENCE"
  | "GENERAL";

export type EventCategory =
  | "MUSIC"
  | "CONCERT"
  | "ART"
  | "EXHIBITION"
  | "THEATRE"
  | "CINEMA"
  | "FESTIVAL"
  | "CULTURE"
  | "OTHER";

export type AttendanceStatus = "INTERESTED" | "GOING";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends PublicUser {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByViewer?: boolean;
  isMutualFriend?: boolean;
}

export interface Interest {
  id: string;
  name: string;
  slug: string;
  relatedCategory: PostCategory | null;
}

export interface CurrentUser extends PublicUser {
  interests: Interest[];
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  category: PostCategory;
  city: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  communityId: string | null;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  likedByViewer?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  country: string;
  venueName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string | null;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
  organizer: PostAuthor;
  attendeesCount: number;
  viewerAttendanceStatus?: AttendanceStatus | null;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  creatorId: string;
  createdAt: string;
  creator: PostAuthor;
  membersCount: number;
  isMember?: boolean;
}

export interface FeedItem {
  post: Post;
  reason: string;
}
