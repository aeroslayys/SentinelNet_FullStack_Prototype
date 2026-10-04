import { createApp } from './app.js';
import { initializePostRepository, resetMemoryStoreForTests } from './repositories/postRepository.js';

await initializePostRepository();
await resetMemoryStoreForTests();

const app = createApp();
const server = app.listen(0, async () => {
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/api`;

  try {
    const health = await fetch(`${base}/health`).then((r) => r.json());
    if (health.status !== 'ok') throw new Error('Health check failed');

    const posts = await fetch(`${base}/posts`).then((r) => r.json());
    if (!Array.isArray(posts.items) || posts.items.length < 1) throw new Error('Posts endpoint failed');
    if (posts.items[0].analysisStatus !== 'pending') throw new Error('Raw posts should begin pending');

    const summary = await fetch(`${base}/summary`).then((r) => r.json());
    if (!Number.isFinite(summary.averageRisk)) throw new Error('Summary failed');

    const network = await fetch(`${base}/network`).then((r) => r.json());
    if (!network.nodes?.length || !network.edges?.length) throw new Error('Network endpoint failed');

    const created = await fetch(`${base}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'P-TEST',
        handle: '@selftest',
        text: 'Test raw post for ingestion.',
        source: 'selftest'
      })
    }).then((r) => r.json());

    if (!created.post || created.post.analysisStatus !== 'pending') throw new Error('Raw ingestion failed');

    console.log('Backend self-test passed (NLP service not required).');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
