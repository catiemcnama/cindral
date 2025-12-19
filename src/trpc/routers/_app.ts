import { users } from '@/db/schema';
import { z } from 'zod';
import { publicProcedure, router } from '../init';

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `Hello ${opts.input.text}`,
      };
    }),

  getUsers: publicProcedure.query(async (opts) => {
    const allUsers = await opts.ctx.db.select().from(users);
    return allUsers;
  }),

  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async (opts) => {
      const [newUser] = await opts.ctx.db
        .insert(users)
        .values({
          name: opts.input.name,
          email: opts.input.email,
        })
        .returning();
      return newUser;
    }),
});

export type AppRouter = typeof appRouter;
