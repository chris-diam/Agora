import { CategoryFeedPage } from "./CategoryFeedPage";

export function MusicPage() {
  return (
    <CategoryFeedPage
      title="Music"
      description="Music posts and upcoming concerts."
      postCategories={["MUSIC"]}
      eventCategories={["MUSIC", "CONCERT"]}
    />
  );
}
