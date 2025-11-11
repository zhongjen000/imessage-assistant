import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { imessageDB } from '@/lib/db/imessage';

export const messagesRouter = createTRPCRouter({
  // Get conversation history with a contact
  getConversation: publicProcedure
    .input(
      z.object({
        contactId: z.string(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const messages = imessageDB.getConversationWithContact(
        input.contactId,
        input.limit
      );
      return messages;
    }),

  // Get all messages for a contact (for analysis)
  getAllForContact: publicProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ input }) => {
      return imessageDB.getAllMessagesForContact(input.contactId);
    }),
});
