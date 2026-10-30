// Entry point: `npm run dev:server` (tsx) or `npm start` (compiled, serves dist/ too).
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.ts';
import { selectModel } from './model/index.ts';

const env = process.env;
// Secrets come from the SERVER environment. If unset, generate one per boot (sessions reset on restart).
const secret = (name: string) => env[name] || randomBytes(32).toString('base64url');
const model = selectModel(env);

const app = createApp({
  sessionSecret: secret('SESSION_SECRET'),
  stepUpSecret: secret('STEP_UP_SECRET'),
  rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 30),
  maxInputChars: Number(env.MAX_INPUT_CHARS ?? 4000),
  model: model.stream,
  modelName: model.name,
});

// Production build: the gateway also serves the client from dist/ (one origin, one container).
if (existsSync('dist/index.html')) app.use('/*', serveStatic({ root: './dist' }));

const port = Number(env.PORT ?? 8787);
const hostname = env.HOST ?? '127.0.0.1';
serve({ fetch: app.fetch, port, hostname }, () => {
  console.log(`[gateway] http://${hostname}:${port}  model=${model.name}`);
});
