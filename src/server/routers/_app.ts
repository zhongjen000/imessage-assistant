import { createTRPCRouter } from '../trpc';
import { contactsRouter } from './contacts';
import { messagesRouter } from './messages';
import { userContextRouter } from './userContext';
import { aiRouter } from './ai';

export const appRouter = createTRPCRouter({
  contacts: contactsRouter,
  messages: messagesRouter,
  userContext: userContextRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
