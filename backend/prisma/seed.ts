import { PostCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The example interests from the project spec. Interests are a table, not
// an enum, so more can be added later (by an admin tool, eventually) without
// a migration. relatedCategory links each (granular, free-text) interest to
// the fixed Post category it should surface in the interest feed — several
// interests can map to the same category (e.g. Jazz/Rock/Classical Music
// all -> MUSIC).
const INTERESTS: { name: string; relatedCategory: PostCategory }[] = [
  { name: "Music", relatedCategory: PostCategory.MUSIC },
  { name: "Jazz", relatedCategory: PostCategory.MUSIC },
  { name: "Rock", relatedCategory: PostCategory.MUSIC },
  { name: "Classical Music", relatedCategory: PostCategory.MUSIC },
  { name: "Balkan Music", relatedCategory: PostCategory.MUSIC },
  { name: "Art", relatedCategory: PostCategory.ART },
  { name: "Theatre", relatedCategory: PostCategory.THEATRE },
  { name: "Cinema", relatedCategory: PostCategory.CINEMA },
  { name: "Technology", relatedCategory: PostCategory.TECHNOLOGY },
  { name: "Science", relatedCategory: PostCategory.SCIENCE },
  { name: "Local News", relatedCategory: PostCategory.LOCAL_NEWS },
  { name: "National News", relatedCategory: PostCategory.NATIONAL_NEWS },
  { name: "International News", relatedCategory: PostCategory.WORLD_NEWS },
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function main() {
  for (const { name, relatedCategory } of INTERESTS) {
    await prisma.interest.upsert({
      where: { name },
      update: { relatedCategory },
      create: { name, slug: slugify(name), relatedCategory },
    });
  }
  console.log(`Seeded ${INTERESTS.length} interests.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
