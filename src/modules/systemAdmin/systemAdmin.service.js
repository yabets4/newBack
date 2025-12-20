import SystemAdminModel from './systemAdmin.model.js';
import bcrypt from 'bcryptjs';
import { default as security } from '../../config/security.config.js';
import PaymentModel from '../../models/PaymentModel.js';

const model = new SystemAdminModel();
const paymentModel = new PaymentModel();

export default {
  // --- Users ---
  listUsers: (opts) => model.findUsers(opts),
  getUser: (id) => model.findUserById(id),
  createUser: async (data) => {
    // Directly store the password without hashing
    return model.createUser({ ...data, password_hash: data.password });
  }
  ,
  updateUser: (id, data) => model.updateUser(id, data),
  removeUser: (id) => model.removeUser(id),

  // --- Pricing Tiers ---
  listPricingTiers: () => model.findPricingTiers(),
  getPricingTier: (id) => model.findPricingTierById(id),
  createPricingTier: (data) => model.createPricingTier(data),
  updatePricingTier: (id, data) => model.updatePricingTier(id, data),
  removePricingTier: (id) => model.removePricingTier(id),

  // --- Pricing Features ---
  listPricingFeatures: (tierId) => model.findPricingFeatures(tierId),
  createPricingFeature: (data) => model.createPricingFeature(data),
  updatePricingFeature: (id, data) => model.updatePricingFeature(id, data),
  removePricingFeature: (id) => model.removePricingFeature(id),

  // --- Company Profiles ---
  createCompanyProfile: async (data) => {
    return model.createCompanyProfile(data);
  },
  getCompanyProfile: async (id) => model.getCompanyProfile(id),
  updateCompanyProfile: async (id, data) => model.updateCompanyProfile(id, data),
  removeCompanyProfile: async (id) => model.removeCompanyProfile(id),

  // --- Locations ---
  createLocations: async (companyId, locations) => model.createLocations(companyId, locations),
  getLocations: async (companyId) => model.getLocations(companyId),

  // --- Payments ---
  createPayment: async (data) => paymentModel.create(data),
  updatePayment: async (id, data) => paymentModel.update(id, data),
  getPaymentsByCompany: async (companyId) => paymentModel.findByCompany(companyId),

  // --- Tenant Users ---
  createTenantUsersTable: async (tableName) => model.createTenantUsersTable(tableName),
  createTenantUsers: async (tableName, users) => model.createTenantUsers(tableName, users),
};
