import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 5050);
const app = createApp();

app.listen(port, () => {
  console.log(`SentinelNet API running at http://localhost:${port}`);
});
