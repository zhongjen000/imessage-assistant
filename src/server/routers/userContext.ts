import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { contextDB } from '@/lib/db/context';

export const userContextRouter = createTRPCRouter({
  // Get all active user context
  getAll: publicProcedure.query(async () => {
    return contextDB.getUserContext();
  }),

  // Add new user context
  add: publicProcedure
    .input(
      z.object({
        contextType: z.string(),
        content: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return contextDB.addUserContext({
        contextType: input.contextType,
        content: input.content,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      });
    }),

  // Delete user context
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      contextDB.deleteUserContext(input.id);
      return { success: true };
    }),
});
