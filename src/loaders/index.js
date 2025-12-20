import expressLoader from './express.loader.js';
import routesLoader from './routes.loader.js';
import './jobs.loader.js';

export default async function initLoaders(app) {
  expressLoader(app);
  routesLoader(app);
}
