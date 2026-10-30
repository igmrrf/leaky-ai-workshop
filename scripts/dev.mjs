// `npm run demo` / `npm run dev`: start the gateway (tsx watch) and the Vite UI together.
// No extra dependency for process management: plain node:child_process.
import { spawn } from 'node:child_process';

const procs = [
  ['gateway', 'npm', ['run', '-s', 'dev:server']],
  ['ui', 'npm', ['run', '-s', 'dev:client']],
].map(([name, cmd, args]) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('exit', (code) => {
    console.log(`[${name}] exited (${code}). Stopping everything.`);
    shutdown(code ?? 0);
  });
  return p;
});

console.log('\n  Leaky AI Workshop -> open http://localhost:5173  (gateway on :8787)\n  Every secret in this app is FAKE.\n');

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const p of procs) p.kill('SIGTERM');
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
