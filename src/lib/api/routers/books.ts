import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { getBookRecommendations, getSimilarBooks, generateBookDescription } from "../../gemini";

export const booksRouter = createTRPCRouter({
  getRecommendations: publicProcedure
    .input(
      z.object({
        minLexile: z.number(),
        maxLexile: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { minLexile, maxLexile } = input;
      return getBookRecommendations(minLexile, maxLexile);
    }),
  
  getSimilarBooks: publicProcedure
    .input(
      z.object({
        bookTitle: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { bookTitle } = input;
      return getSimilarBooks(bookTitle);
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
}); 