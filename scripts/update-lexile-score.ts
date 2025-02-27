import { updateBookLexileScore } from "../src/lib/db/books";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Updating Lexile score for 'Out of My Mind' by Sharon M. Draper to 700L...");
  
  try {
    const updatedBook = await updateBookLexileScore("Out of My Mind", "Sharon M. Draper", 700);
    
    if (updatedBook) {
      console.log("Successfully updated book:", updatedBook);
    } else {
      console.log("Book not found in database. Creating it now...");
      
      const newBook = await prisma.book.create({
        data: {
          title: "Out of My Mind",
          author: "Sharon M. Draper",
          lexileScore: 700,
          description: "Melody is not like most people. She cannot walk or talk, but she has a photographic memory; she can remember every detail of everything she has ever experienced. She is smarter than most of the adults who try to diagnose her and smarter than her classmates in her integrated classroom—the very same classmates who dismiss her as mentally challenged, because she cannot tell them otherwise. But Melody refuses to be defined by cerebral palsy. And she's determined to let everyone know it…somehow."
        }
      });
      
      console.log("Created new book with correct Lexile score:", newBook);
    }
  } catch (error) {
    console.error("Error updating Lexile score:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 