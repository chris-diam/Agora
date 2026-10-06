// "18 min ago" / "3h ago" / "2d ago" style relative time, matching the
// density the redesigned post cards need — Intl.RelativeTimeFormat would
// work too, but this reads closer to the mockup's exact phrasing ("18 min
// ago" rather than "18 minutes ago").
export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

// Posts/events created within this window get the "LIVE" badge prefix —
// a lightweight freshness signal, not a real live-stream indicator.
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

export function isRecent(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() < LIVE_WINDOW_MS;
}
