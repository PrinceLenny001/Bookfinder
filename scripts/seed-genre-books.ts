import { prisma } from "../src/lib/db";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Adventure",
  "Realistic Fiction",
  "Historical Fiction",
  "Graphic Novels",
  "Horror",
  "Poetry",
  "Biography",
  "Sports",
  "Humor",
  "Informational",
  "Autobiography",
  "Memoir",
  "Novel in Verse",
  "Dystopian"
];

function makeBook(genre: string, index: number) {
  const title = `${genre} Book ${index + 1}`;
  const author = `${genre} Author ${index + 1}`;
  const lexileScore = 600 + ((index * 20 + genre.length * 13) % 700); // 600-1300L
  const description = `A ${genre.toLowerCase()} story: ${title} by ${author}.`;
  return { title, author, lexileScore, description };
}

async function main() {
  try {
    console.log("Seeding 25 books for each genre...");
    let totalAdded = 0;
    for (const genre of GENRES) {
      for (let i = 0; i < 25; i++) {
        const book = makeBook(genre, i);
        // Check if book already exists
        const existing = await prisma.book.findFirst({
          where: { title: book.title, author: book.author }
        });
        if (!existing) {
          await prisma.book.create({ data: book });
          totalAdded++;
          console.log(`Added: ${book.title} by ${book.author}`);
        } else {
          console.log(`Skipped: ${book.title} by ${book.author}`);
        }
      }
    }
    const count = await prisma.book.count();
    console.log(`\nDone. Added ${totalAdded} new books. Database now has ${count} books.`);
  } catch (error) {
    console.error("Error seeding genre books:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 