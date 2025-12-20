import { Router } from 'express';
import LocationsController from './locations.controller.js';

const r = Router();

r.post('/:companyId', LocationsController.createLocation);
r.get('/company/:companyId', LocationsController.getCompanyLocations);
r.get('/:locationId', LocationsController.getLocation);

export default r;
