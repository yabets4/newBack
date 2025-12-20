import LocationsModel from './locations.model.js';
const model = new LocationsModel();

export default {
  createLocation: (companyId, locationData) =>
    model.createLocation(companyId, locationData),

  getLocationsByCompany: (companyId) =>
    model.getLocationsByCompany(companyId),

  getLocationById: (locationId) =>
    model.getLocationById(locationId),
};
