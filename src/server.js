import app from './app.js';
import { appConfig } from './config/index.js';
import logger from './config/logger.config.js';

const port = process.env.PORT || 5001; // use Cloudflare port if available, fallback to .env default

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
