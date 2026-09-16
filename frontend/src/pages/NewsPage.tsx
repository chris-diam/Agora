import { CategoryFeedPage } from "./CategoryFeedPage";

export function NewsPage() {
  return (
    <CategoryFeedPage
      title="News"
      description="Local, national, and world news posted by people you're connected to."
      postCategories={["LOCAL_NEWS", "NATIONAL_NEWS", "WORLD_NEWS"]}
    />
  );
}
