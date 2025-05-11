import { prisma } from "../src/lib/db";

async function main() {
  try {
    console.log("Testing database connection...");
    
    // Try to count books in the database
    const bookCount = await prisma.book.count();
    console.log(`Successfully connected to database. Found ${bookCount} books.`);
    
    // Try to fetch a few books
    const books = await prisma.book.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log("\nSample books from database:");
    books.forEach(book => {
      console.log(`- ${book.title} by ${book.author} (Lexile: ${book.lexileScore})`);
    });
    
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 