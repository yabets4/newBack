import express from 'express';
import initLoaders from './loaders/index.js';
import auditMiddleware from './middleware/audit.middleware.js';
import { authenticateJWT } from './middleware/jwt.middleware.js';

const app = express();
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return next();
	return authenticateJWT(req, res, next);
});
app.use(auditMiddleware());

await initLoaders(app);
export default app;
