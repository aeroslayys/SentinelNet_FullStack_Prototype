import 'dotenv/config';
import { createApp } from './app.js';
import { initializePostRepository } from './repositories/postRepository.js';

const port = Number(process.env.PORT || 5050);

try {
  await initializePostRepository();
  const app = createApp();

  app.listen(port, () => {
    console.log(`SentinelNet API running at http://localhost:${port}`);
  });
} catch (error) {
  console.error('Failed to start SentinelNet API:', error);
  process.exit(1);
}
