import { prisma } from "../src/lib/db";

// Function to extract numeric value from Lexile string formats like "GN480L"
function extractNumericLexile(lexileString: string): number {
  // If it's already a number, return it
  if (!isNaN(Number(lexileString))) {
    return Number(lexileString);
  }
  
  // Extract numbers from formats like "GN480L", "480L", etc.
  const matches = lexileString.match(/(\d+)/);
  if (matches && matches[1]) {
    return parseInt(matches[1], 10);
  }
  
  // Default to 0 if no number found
  return 0;
}

async function main() {
  console.log("Checking all books for non-numeric Lexile scores...");
  
  try {
    // Get all books
    const books = await prisma.book.findMany();
    console.log(`Found ${books.length} books in the database.`);
    
    let fixedCount = 0;
    
    // Check each book
    for (const book of books) {
      let lexileScore = book.lexileScore;
      let needsUpdate = false;
      
      // Check if lexileScore is not a number or is a string
      if (typeof lexileScore !== 'number' || isNaN(lexileScore)) {
        console.log(`Book "${book.title}" by ${book.author} has non-numeric Lexile score: ${lexileScore}`);
        
        // If it's a string, try to extract the numeric part
        if (typeof lexileScore === 'string') {
          lexileScore = extractNumericLexile(lexileScore);
        } else {
          // Default to 0 if we can't determine a value
          lexileScore = 0;
        }
        
        needsUpdate = true;
      }
      
      // Update the book if needed
      if (needsUpdate) {
        console.log(`Updating "${book.title}" by ${book.author} with Lexile score: ${lexileScore}`);
        
        await prisma.book.update({
          where: { id: book.id },
          data: { 
            lexileScore: lexileScore
          }
        });
        
        fixedCount++;
      }
    }
    
    console.log(`Finished checking all books. Fixed ${fixedCount} books with non-numeric Lexile scores.`);
  } catch (error) {
    console.error("Error checking Lexile scores:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 