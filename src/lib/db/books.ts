import { prisma } from "@/lib/db";
import type { Book } from "@prisma/client";
import { getBookRecommendations as getGeminiBookRecommendations } from "@/lib/gemini";

export type { Book };

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
  title: string | undefined = undefined
): Promise<Book[]> {
  // If searching by title, first check database
  if (title) {
    const dbBooks = await prisma.book.findMany({
      where: {
        title: {
          contains: title,
          mode: 'insensitive'
        }
      }
    });

    // If we found books in DB, return them
    if (dbBooks.length > 0) {
      return dbBooks;
    }
  }

  // If searching by lexile range without title, check database first
  if (!title) {
    const dbBooks = await prisma.book.findMany({
      where: {
        lexileScore: {
          gte: minLexile,
          lte: maxLexile
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If we found enough books in DB and no genre filter, return them in random order
    if (dbBooks.length >= 5 && !genre) {
      // Shuffle the array using Fisher-Yates algorithm
      for (let i = dbBooks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dbBooks[i], dbBooks[j]] = [dbBooks[j], dbBooks[i]];
      }
      return dbBooks.slice(0, 5); // Return only 5 random books
    }
  }

  // If we don't have enough books in DB or have a genre filter, get recommendations from Gemini
  const geminiBooks = await getGeminiBookRecommendations(minLexile, maxLexile, genre, title);

  // Save new books to database
  const savedBooks = await Promise.all(
    geminiBooks.map(book => 
      findOrCreateBook(book.title, book.author, book.lexileScore, book.description)
    )
  );

  return savedBooks;
} 