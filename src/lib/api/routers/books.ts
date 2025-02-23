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
        genre: z.enum([
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
        ]).nullable(),
        title: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getBookRecommendations(input.minLexile, input.maxLexile, input.genre, input.title);
    }),
  
  getSimilarBooks: publicProcedure
    .input(
      z.object({
        bookTitle: z.string(),
        genre: z.enum([
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
        ]).nullable(),
      })
    )
    .query(async ({ input }) => {
      return getSimilarBooks(input.bookTitle, input.genre);
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
}); 