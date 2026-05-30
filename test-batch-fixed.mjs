import express from 'express';
import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { z } from 'zod';

const t = initTRPC.create();

const appRouter = t.router({
  echo: t.procedure.input(z.object({ message: z.string() })).mutation(({ input }) => {
    return `You said: ${input.message}`;
  }),
});

const app = express();
app.use(express.json());
app.use('/trpc', createExpressMiddleware({ router: appRouter }));

app.listen(3002, () => {
  console.log('✓ Test server listening on :3002');
  setTimeout(async () => {
    try {
      const res = await fetch('http://localhost:3002/trpc/echo?batch=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': { message: 'Test from batch!' } }),
      });
      const data = await res.json();
      console.log('✓ Batch mutation response:', JSON.stringify(data, null, 2));
      console.log(res.status === 200 ? '✅ SUCCESS - Fix works!' : '❌ FAILED');
      process.exit(res.status === 200 ? 0 : 1);
    } catch (err) {
      console.error('❌ Test failed:', err.message);
      process.exit(1);
    }
  }, 500);
});
