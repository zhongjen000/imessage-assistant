import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { imessageDB } from '@/lib/db/imessage';
import { contextDB } from '@/lib/db/context';

export const contactsRouter = createTRPCRouter({
  // Get all contacts from iMessage with preview and sorted by recency
  getAll: publicProcedure.query(async () => {
    const imessageContacts = imessageDB.getContactsWithPreview();

    // Merge with context data
    const enrichedContacts = imessageContacts.map((contact) => {
      const contextData = contextDB.getContact(contact.phoneNumber);
      return {
        ...contact,
        contextData,
      };
    });

    return enrichedContacts;
  }),

  // Search contacts
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return imessageDB.searchContacts(input.query);
    }),

  // Get contact with context
  getWithContext: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .query(async ({ input }) => {
      const imessageContact = imessageDB.getContacts().find(
        (c) => c.phoneNumber === input.phoneNumber
      );
      const contextData = contextDB.getContact(input.phoneNumber);

      return {
        contact: imessageContact,
        context: contextData,
      };
    }),

  // Update contact context
  updateContext: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        name: z.string().optional(),
        relationshipType: z.string().optional(),
        formalityLevel: z.enum(['casual', 'neutral', 'formal']).optional(),
        backgroundContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { phoneNumber, ...updates } = input;
      const existingContact = contextDB.getContact(phoneNumber);

      const updatedContact = contextDB.upsertContact({
        phoneNumber,
        name: updates.name ?? existingContact?.name ?? null,
        relationshipType: updates.relationshipType ?? existingContact?.relationshipType ?? null,
        formalityLevel: updates.formalityLevel ?? existingContact?.formalityLevel ?? null,
        communicationStyle: existingContact?.communicationStyle ?? null,
        backgroundContext: updates.backgroundContext ?? existingContact?.backgroundContext ?? null,
      });

      return updatedContact;
    }),
});
