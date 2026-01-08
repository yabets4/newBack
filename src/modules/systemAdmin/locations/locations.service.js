import LocationsModel from './locations.model.js';
const model = new LocationsModel();

export default {
  createLocation: async (companyId, locationData) => {
    // Accept either a single location object or an object containing a `locations` array
    if (locationData && Array.isArray(locationData.locations)) {
      const created = [];
      for (const loc of locationData.locations) {
        const row = await model.createLocation(companyId, loc);
        created.push(row);
      }
      return created;
    }
    return model.createLocation(companyId, locationData);
  },

  getLocationsByCompany: (companyId) =>
    model.getLocationsByCompany(companyId),

  getLocationById: (locationId) =>
    model.getLocationById(locationId),
};
