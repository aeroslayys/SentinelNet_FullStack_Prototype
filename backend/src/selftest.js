import { createApp } from './app.js';

const app = createApp();
const server = app.listen(0, async () => {
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;
  try {
    const health = await fetch(`${base}/health`).then((r) => r.json());
    if (health.status !== 'ok') throw new Error('Health check failed');

    const summary = await fetch(`${base}/summary`).then((r) => r.json());
    if (!Number.isFinite(summary.averageRisk)) throw new Error('Summary failed');

    const evidence = await fetch(`${base}/evidence`).then((r) => r.json());
    if (!evidence.items?.length) throw new Error('Evidence list failed');

    const verify = await fetch(`${base}/evidence/${evidence.items[0].id}/verify`, { method: 'POST' }).then((r) => r.json());
    if (!verify.valid) throw new Error('Evidence verification failed');

    console.log('Backend self-test passed.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
