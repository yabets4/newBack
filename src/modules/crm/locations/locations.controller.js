import service from './locations.service.js';
import { ok, notFound } from '../../../utils/apiResponse.js';

export default class LocationsController {
  static async createLocation(req, res, next) {
    try {
      const { companyId } = req.params;
      const data = await service.createLocation(companyId, req.body);
      console.log('req.body:', req.body);
      
      console.log('Created Location:', data);
      
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async getCompanyLocations(req, res, next) {
    try {
      const { companyId } = req.params;
      const data = await service.getLocationsByCompany(companyId);
      if (!data.length) return notFound(res, 'No locations found for this company');
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async getLocation(req, res, next) {
    try {
      const { locationId } = req.params;
      const data = await service.getLocationById(locationId);
      if (!data) return notFound(res, 'Location not found');
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
