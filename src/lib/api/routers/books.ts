import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { getBookRecommendations, getSimilarBooks, generateBookDescription, getBookMetadata, getBooksByGenre } from "../../gemini";
import { getBooksByLexileRange, findOrCreateBook, updateBookLexileScore } from "@/lib/db/books";
import { prisma } from "@/lib/db";

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
] as const;

export const booksRouter = createTRPCRouter({
  getRecommendations: publicProcedure
    .input(
      z.object({
        minLexile: z.number(),
        maxLexile: z.number(),
        genre: z.string().nullable(),
        title: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { minLexile, maxLexile, genre, title } = input;
      return getBooksByLexileRange(minLexile, maxLexile, genre, title);
    }),
  
  getSimilarBooks: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
        lexileScore: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { lexileScore } = input;
      
      // Find books with similar Lexile scores (within 100 points)
      const similarBooks = await prisma.book.findMany({
        where: {
          lexileScore: {
            gte: lexileScore - 100,
            lte: lexileScore + 100,
          },
          NOT: {
            AND: [
              { title: input.title },
              { author: input.author }
            ]
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return similarBooks;
    }),

  generateDescription: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
      })
    )
    .query(async ({ input }) => {
      return generateBookDescription(input.title, input.author);
    }),

  getMetadata: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getBookMetadata(input.title, input.author);
    }),
    
  findOrCreateBook: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
        lexileScore: z.number(),
        description: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { title, author, lexileScore, description } = input;
      return findOrCreateBook(title, author, lexileScore, description);
    }),
    
  updateLexileScore: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
        lexileScore: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { title, author, lexileScore } = input;
      return updateBookLexileScore(title, author, lexileScore);
    }),
}); 