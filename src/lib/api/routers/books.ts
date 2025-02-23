import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { getBookRecommendations, getSimilarBooks, generateBookDescription, getBookMetadata, getBooksByGenre } from "../../gemini";

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
] as const;

export const booksRouter = createTRPCRouter({
  getRecommendations: publicProcedure
    .input(
      z.object({
        minLexile: z.number(),
        maxLexile: z.number(),
        genre: z.enum(GENRES).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { minLexile, maxLexile, genre } = input;
      if (genre) {
        return getBooksByGenre(minLexile, maxLexile, genre);
      }
      return getBookRecommendations(minLexile, maxLexile);
    }),
  
  getSimilarBooks: publicProcedure
    .input(
      z.object({
        bookTitle: z.string(),
        genre: z.enum(GENRES).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { bookTitle, genre } = input;
      return getSimilarBooks(bookTitle, genre);
    }),

  generateDescription: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { title, author } = input;
      return generateBookDescription(title, author);
    }),

  getMetadata: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { title, author } = input;
      return getBookMetadata(title, author);
    }),
}); 