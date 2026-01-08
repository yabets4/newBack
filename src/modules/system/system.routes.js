import { Router } from 'express';
import roleRoutes from './role/role.routes.js';
import userRoutes from './user/user.routes.js';


const r = Router();

// Mount sub-modules
r.use('/role', roleRoutes);
r.use('/users', userRoutes);

export default r;
