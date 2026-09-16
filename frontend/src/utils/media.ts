// Extracts a YouTube video ID from the common URL shapes people paste
// (watch?v=, youtu.be/, shorts/, embed/). Returns null for anything else,
// which callers treat as "just render it as a plain link".
export const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const shortsMatch = parsed.pathname.match(/^\/(shorts|embed)\/([^/]+)/);
      if (shortsMatch) return shortsMatch[2];
    }

    return null;
  } catch {
    return null;
  }
};
