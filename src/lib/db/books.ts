import { prisma } from "@/lib/db";
import type { Book } from "@prisma/client";
import { getBookRecommendations as getGeminiBookRecommendations } from "@/lib/gemini";

export type { Book };

export async function findOrCreateBook(title: string, author: string, lexileScore: number): Promise<Book> {
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
      lexileScore
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
      }
    });

    // If we found enough books in DB, return them
    if (dbBooks.length >= 5) {
      return dbBooks;
    }
  }

  // If we don't have enough books in DB, get recommendations from Gemini
  const geminiBooks = await getGeminiBookRecommendations(minLexile, maxLexile, genre, title);

  // Save new books to database
  const savedBooks = await Promise.all(
    geminiBooks.map(book => 
      findOrCreateBook(book.title, book.author, book.lexileScore)
    )
  );

  return savedBooks;
} 