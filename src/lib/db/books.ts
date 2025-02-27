import { prisma } from "@/lib/db";
import { getBookRecommendations, getBooksByGenre } from "@/lib/gemini";
import type { BookRecommendation } from "@/lib/gemini";
import type { Book as PrismaBook } from "@prisma/client";
import { fetchBookCover } from "@/lib/utils/bookCovers";

export type Book = {
  id: string;
  title: string;
  author: string;
  lexileScore: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  coverOptions?: any;
  externalCoverUrl?: string | null;
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

  // Try to fetch an external cover URL
  let externalCoverUrl = null;
  try {
    externalCoverUrl = await fetchBookCover(title, author);
  } catch (error) {
    console.error(`Error fetching cover for ${title} by ${author}:`, error);
  }

  return prisma.book.create({
    data: {
      title,
      author,
      lexileScore,
      description,
      externalCoverUrl,
      coverOptions: generateDefaultCoverOptions(title, author)
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
        // Ensure each book has coverOptions and try to fetch external covers if missing
        const booksWithCovers = await Promise.all(titleBooks.map(async (book) => {
          let updatedBook = { ...book };
          
          // If the book doesn't have coverOptions, add them
          if (!book.coverOptions) {
            updatedBook.coverOptions = generateDefaultCoverOptions(book.title, book.author);
          }
          
          // If the book doesn't have an external cover URL, try to fetch one
          if (!book.externalCoverUrl) {
            try {
              const coverUrl = await fetchBookCover(book.title, book.author);
              if (coverUrl) {
                updatedBook.externalCoverUrl = coverUrl;
                
                // Update the book in the database with the new cover URL
                await prisma.book.update({
                  where: { id: book.id },
                  data: { 
                    externalCoverUrl: coverUrl,
                    coverOptions: updatedBook.coverOptions as any
                  }
                });
              }
            } catch (error) {
              console.error(`Error fetching cover for ${book.title} by ${book.author}:`, error);
            }
          }
          
          return updatedBook;
        }));
        
        return booksWithCovers;
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
              // Try to fetch an external cover URL
              let externalCoverUrl = null;
              try {
                externalCoverUrl = await fetchBookCover(rec.title, rec.author);
              } catch (error) {
                console.error(`Error fetching cover for ${rec.title} by ${rec.author}:`, error);
              }
              
              // Check if book already exists
              const existingBook = await prisma.book.findFirst({
                where: {
                  title: { equals: rec.title, mode: 'insensitive' },
                  author: { equals: rec.author, mode: 'insensitive' },
                },
              });

              if (existingBook) {
                // If the book exists but doesn't have coverOptions or externalCoverUrl, update it
                if (!existingBook.coverOptions || 
                    (Array.isArray(existingBook.coverOptions) && (existingBook.coverOptions as any).length === 0) ||
                    !existingBook.externalCoverUrl) {
                  return prisma.book.update({
                    where: { id: existingBook.id },
                    data: { 
                      coverOptions: rec.coverOptions || generateDefaultCoverOptions(rec.title, rec.author),
                      externalCoverUrl: externalCoverUrl || existingBook.externalCoverUrl
                    }
                  });
                }
                return existingBook;
              }

              // Create new book
              return prisma.book.create({
                data: {
                  title: rec.title,
                  author: rec.author,
                  lexileScore: rec.lexileScore,
                  description: rec.description || null,
                  coverOptions: rec.coverOptions || generateDefaultCoverOptions(rec.title, rec.author),
                  externalCoverUrl
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

    // Ensure each book has coverOptions and try to fetch external covers if missing
    const booksWithCovers = await Promise.all(books.map(async (book) => {
      let updatedBook = { ...book };
      let needsUpdate = false;
      
      // If the book doesn't have coverOptions, add them
      if (!book.coverOptions || 
          (Array.isArray(book.coverOptions) && (book.coverOptions as any).length === 0)) {
        updatedBook.coverOptions = generateDefaultCoverOptions(book.title, book.author);
        needsUpdate = true;
      }
      
      // If the book doesn't have an external cover URL, try to fetch one
      if (!book.externalCoverUrl) {
        try {
          const coverUrl = await fetchBookCover(book.title, book.author);
          if (coverUrl) {
            updatedBook.externalCoverUrl = coverUrl;
            needsUpdate = true;
          }
        } catch (error) {
          console.error(`Error fetching cover for ${book.title} by ${book.author}:`, error);
        }
      }
      
      // Update the book in the database if needed
      if (needsUpdate) {
        await prisma.book.update({
          where: { id: book.id },
          data: { 
            coverOptions: updatedBook.coverOptions as any,
            externalCoverUrl: updatedBook.externalCoverUrl
          }
        });
      }
      
      return updatedBook;
    }));

    // If we have at least 5 books, shuffle them and return 5
    if (booksWithCovers.length >= 5) {
      // Fisher-Yates shuffle
      for (let i = booksWithCovers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [booksWithCovers[i], booksWithCovers[j]] = [booksWithCovers[j], booksWithCovers[i]];
      }
      return booksWithCovers.slice(0, 5);
    }

    return booksWithCovers;
  } catch (error) {
    console.error("Error getting books by Lexile range:", error);
    return [];
  }
}

// Helper function to generate default cover options
function generateDefaultCoverOptions(title: string, author: string) {
  // Generate a hash from the title and author for consistent colors
  const hash = (title + author).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Generate different cover styles based on the hash
  const coverStyles = ['minimalist', 'watercolor', 'gradient', 'abstract', 'illustrated'];
  const coverStyle1 = coverStyles[Math.abs(hash) % coverStyles.length];
  const coverStyle2 = coverStyles[Math.abs(hash + 1) % coverStyles.length];
  const coverStyle3 = coverStyles[Math.abs(hash + 2) % coverStyles.length];
  
  return [
    {
      description: `${title} by ${author} with a ${coverStyle1} design`,
      style: coverStyle1
    },
    {
      description: `${title} by ${author} with a ${coverStyle2} design`,
      style: coverStyle2
    },
    {
      description: `${title} by ${author} with a ${coverStyle3} design`,
      style: coverStyle3
    }
  ];
} 