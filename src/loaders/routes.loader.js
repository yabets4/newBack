import router from '../routes/index.js';

export default function routesLoader(app) {
  app.use('/api', router);

  // Log available routes for debugging (helps diagnose 404s)
}