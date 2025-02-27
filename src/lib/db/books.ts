import { prisma } from "@/lib/db";
import { getBookRecommendations, getBooksByGenre } from "@/lib/gemini";
import type { BookRecommendation } from "@/lib/gemini";
import type { Book as PrismaBook } from "@prisma/client";

export type Book = {
  id: string;
  title: string;
  author: string;
  lexileScore: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  coverOptions?: any;
};

export async function findOrCreateBook(title: string, author: string, lexileScore: number, description: string | null = null): Promise<Book> {
  const existingBook = await prisma.book.findUnique({
    where: {
      title_author: {
        title,
        author
      }
    }
  });

  if (existingBook) {
    return existingBook;
  }

  return prisma.book.create({
    data: {
      title,
      author,
      lexileScore,
      description
    }
  });
}

export async function getBooksByLexileRange(
  minLexile: number,
  maxLexile: number,
  genre: string | null = null,
  title: string | null = null
): Promise<Book[]> {
  console.log(`Searching for books with Lexile range ${minLexile}-${maxLexile}, genre: ${genre}, title: ${title}`);
  
  try {
    // If title is provided, search by title first
    if (title) {
      const titleBooks = await prisma.book.findMany({
        where: {
          title: {
            contains: title,
            mode: 'insensitive',
          },
          lexileScore: {
            gte: minLexile,
            lte: maxLexile,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      if (titleBooks.length > 0) {
        return titleBooks;
      }
    }

    // If genre is provided, we'll need to get recommendations from Gemini
    if (genre) {
      console.log(`Fetching books by genre: ${genre}`);
      try {
        // Get recommendations from Gemini API
        const recommendations = await getBookRecommendations(minLexile, maxLexile, genre, title || undefined);
        
        if (recommendations && recommendations.length > 0) {
          console.log(`Found ${recommendations.length} recommendations for genre ${genre}`);
          
          // Create or update books in the database
          const books = await Promise.all(
            recommendations.map(async (rec) => {
              // Check if book already exists
              const existingBook = await prisma.book.findFirst({
                where: {
                  title: { equals: rec.title, mode: 'insensitive' },
                  author: { equals: rec.author, mode: 'insensitive' },
                },
              });

              if (existingBook) {
                return existingBook;
              }

              // Create new book
              return prisma.book.create({
                data: {
                  title: rec.title,
                  author: rec.author,
                  lexileScore: rec.lexileScore,
                  description: rec.description || null,
                  coverOptions: rec.coverOptions || [],
                },
              });
            })
          );

          return books;
        }
      } catch (error) {
        console.error("Error getting books by genre:", error);
      }
    }

    // Fallback to database query if no genre or if genre search failed
    const books = await prisma.book.findMany({
      where: {
        lexileScore: {
          gte: minLexile,
          lte: maxLexile,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // If we have at least 5 books, shuffle them and return 5
    if (books.length >= 5) {
      // Fisher-Yates shuffle
      for (let i = books.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [books[i], books[j]] = [books[j], books[i]];
      }
      return books.slice(0, 5);
    }

    return books;
  } catch (error) {
    console.error("Error getting books by Lexile range:", error);
    return [];
  }
} 