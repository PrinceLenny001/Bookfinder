import { prisma } from "../src/lib/db";

async function main() {
  console.log("Fixing Lexile score format for 'Out of My Mind' by Sharon M. Draper...");
  
  try {
    // Find the book
    const book = await prisma.book.findUnique({
      where: {
        title_author: {
          title: "Out of My Mind",
          author: "Sharon M. Draper"
        }
      }
    });

    if (!book) {
      console.log("Book not found in database.");
      return;
    }

    console.log("Current book data:", book);
    
    // Check if lexileScore is a string or has non-numeric format
    let lexileScore = book.lexileScore;
    let needsUpdate = false;
    
    // If it's not a number (could be stored as a string in JSON)
    if (typeof lexileScore !== 'number') {
      console.log(`Found non-numeric Lexile score: ${lexileScore}`);
      needsUpdate = true;
      lexileScore = 700; // Set to the correct value of 700
    }
    
    // Update the book if needed
    if (needsUpdate) {
      const updatedBook = await prisma.book.update({
        where: { id: book.id },
        data: { 
          lexileScore: lexileScore
        }
      });
      
      console.log("Updated book with correct Lexile score format:", updatedBook);
    } else {
      console.log("No update needed, Lexile score is already in the correct format.");
    }
  } catch (error) {
    console.error("Error fixing Lexile score format:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 