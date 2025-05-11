import { prisma } from "../src/lib/db";

const initialBooks = [
  {
    title: "Out of My Mind",
    author: "Sharon M. Draper",
    lexileScore: 700,
    description: "Melody is not like most people. She cannot walk or talk, but she has a photographic memory; she can remember every detail of everything she has ever experienced. She is smarter than most of the adults who try to diagnose her and smarter than her classmates in her integrated classroom—the very same classmates who dismiss her as mentally challenged, because she cannot tell them otherwise. But Melody refuses to be defined by cerebral palsy. And she's determined to let everyone know it…somehow."
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    lexileScore: 760,
    description: "The Giver is a 1993 American young adult dystopian novel by Lois Lowry. It is set in a society which at first appears to be utopian but is revealed to be dystopian as the story progresses. The novel follows a 12-year-old boy named Jonas."
  },
  {
    title: "Wonder",
    author: "R.J. Palacio",
    lexileScore: 790,
    description: "Wonder is a children's novel by Raquel Jaramillo, under the pen name of R. J. Palacio, published on February 14, 2012. R. J. Palacio wrote Wonder after an incident where her son noticed a girl with a severe facial difference and started to cry."
  },
  {
    title: "The One and Only Ivan",
    author: "Katherine Applegate",
    lexileScore: 570,
    description: "The One and Only Ivan is a 2012 children's novel written by Katherine Applegate and illustrated by Patricia Castelao. It is about a silverback gorilla named Ivan who lived in a cage at a mall, and is written from Ivan's perspective."
  },
  {
    title: "Holes",
    author: "Louis Sachar",
    lexileScore: 660,
    description: "Holes is a 1998 young adult novel written by Louis Sachar and first published by Farrar, Straus and Giroux. The book centers on an unlucky teenage boy named Stanley Yelnats, who is sent to Camp Green Lake, a juvenile corrections facility in a desert in Texas, after being falsely accused of theft."
  }
];

async function main() {
  try {
    console.log("Seeding database with initial books...");
    
    // Check if we already have books
    const existingCount = await prisma.book.count();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} books. Skipping seed.`);
      return;
    }
    
    // Add books to database
    for (const book of initialBooks) {
      await prisma.book.create({
        data: book
      });
      console.log(`Added "${book.title}" by ${book.author}`);
    }
    
    console.log("\nSuccessfully seeded database with initial books!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 