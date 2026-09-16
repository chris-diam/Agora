import { CategoryFeedPage } from "./CategoryFeedPage";

export function ArtsCulturePage() {
  return (
    <CategoryFeedPage
      title="Arts & culture"
      description="Art, theatre, cinema, and culture posts and upcoming events."
      postCategories={["ART", "CULTURE", "THEATRE", "CINEMA"]}
      eventCategories={["ART", "EXHIBITION", "THEATRE", "CINEMA", "CULTURE", "FESTIVAL"]}
    />
  );
}
