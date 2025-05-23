import { createTRPCRouter } from "./trpc";
import { booksRouter } from "./routers/books";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  books: booksRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

// Export a caller creator for use in RSC
export const createCaller = appRouter.createCaller;
