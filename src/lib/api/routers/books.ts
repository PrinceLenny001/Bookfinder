import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { getBookRecommendations } from "../../gemini";

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
}); 