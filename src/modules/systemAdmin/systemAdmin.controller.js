import service from './systemAdmin.service.js';
import { ok, created, noContent, notFound } from '../../utils/apiResponse.js';
import monitoringService from './monitoring/monitoring.service.js';
import { saveCompanyLogo, getCompanyLogo } from './main/main.service.js';
import * as srv from './main/main.service.js';

export default {
  // Users
  listUsers: async (req, res, next) => { try { const data = await service.listUsers(req.query); return ok(res, data); } catch (e) { next(e); } },
  getUser: async (req, res, next) => { try { const item = await service.getUser(req.params.id); if(!item) return notFound(res); return ok(res, item); } catch(e){ next(e); } },
  createUser: async (req,res,next) => { try { const data = await service.createUser(req.body); return created(res,data); } catch(e){ next(e); } },
  updateUser: async (req,res,next) => { try { const data = await service.updateUser(req.params.id, req.body); if(!data) return notFound(res); return ok(res,data); } catch(e){ next(e); } },
  removeUser: async (req,res,next) => { try { await service.removeUser(req.params.id); return noContent(res); } catch(e){ next(e); } },

  // Pricing Tiers
  listPricingTiers: async (req,res,next) => { try { const data = await service.listPricingTiers(); return ok(res,data); } catch(e){ next(e); } },
  getPricingTier: async (req,res,next) => { try { const item = await service.getPricingTier(req.params.id); if(!item) return notFound(res); return ok(res,item); } catch(e){ next(e); } },
  createPricingTier: async (req,res,next) => { try { const data = await service.createPricingTier(req.body); return created(res,data); } catch(e){ next(e); } },
  updatePricingTier: async (req,res,next) => { try { const data = await service.updatePricingTier(req.params.id, req.body); if(!data) return notFound(res); return ok(res,data); } catch(e){ next(e); } },
  removePricingTier: async (req,res,next) => { try { await service.removePricingTier(req.params.id); return noContent(res); } catch(e){ next(e); } },

  // Pricing Features
  listPricingFeatures: async (req,res,next) => { try { const data = await service.listPricingFeatures(req.query.tierId); return ok(res,data); } catch(e){ next(e); } },
  createPricingFeature: async (req,res,next) => { try { const data = await service.createPricingFeature(req.body); return created(res,data); } catch(e){ next(e); } },
  updatePricingFeature: async (req,res,next) => { try { const data = await service.updatePricingFeature(req.params.id, req.body); if(!data) return notFound(res); return ok(res,data); } catch(e){ next(e); } },
  removePricingFeature: async (req,res,next) => { try { await service.removePricingFeature(req.params.id); return noContent(res); } catch(e){ next(e); } },

  // --- Onboarding Wizard: Company Profiles ---
  createCompanyProfile: async (req, res, next) => {
    try {
      console.log('--- Incoming request body ---');
      console.log(req.body);

      // Flattened FormData fields
      const companyPayload = {
        company_name: req.body.company_name,
        legal_name: req.body.legal_name,
        registration_number: req.body.registration_number,
        physical_address: req.body.physical_address,
        default_currency: req.body.default_currency,
        industry: req.body.industry,
        business_model: req.body.business_model,
        pricing_tier: req.body.pricing_tier,
        company_logo_url: req.files?.companyLogo?.[0]?.filename || null,
        tin_document_url: req.files?.tinDocument?.[0]?.filename || null,
        business_license_url: req.files?.businessLicense?.[0]?.filename || null,
        trade_license_url: req.files?.tradeLicense?.[0]?.filename || null,
      };

      const usersPayload = [
        {
          name: req.body.owner_name,
          email: req.body.owner_email,
          phone: req.body.owner_phone,
          password: req.body.owner_password,
          role: 'Owner'
        },
        {
          name: req.body.sub_admin_name,
          email: req.body.sub_admin_email,
          phone: req.body.sub_admin_phone,
          password: req.body.sub_admin_password,
          role: 'Sub-Admin'
        }
      ];

      const paymentPayload = req.body.paymentPayload; // optional

      if (!companyPayload.company_name) {
        return res.status(400).json({ message: 'company_name is required' });
      }

      // 1️⃣ Create company profile
      const company = await service.createCompanyProfile(companyPayload);
      console.log('Company created:', company);

      // 2️⃣ Save payment info
      if (paymentPayload) {
        await service.createPayment({
          company_id: company.id,
          billing_contact_name: paymentPayload.billing_contact_name,
          billing_email: paymentPayload.billing_email,
          billing_address: paymentPayload.billing_address,
          payment_method: paymentPayload.payment_method,
          payment_details: paymentPayload.payment_details
        });
        console.log('Payment info saved for company:', company.id);
      }

      // 3️⃣ Create tenant users table
      const prefix = company.company_name.toLowerCase().replace(/\s+/g, '_');
      const tenantUsersTable = `${prefix}_users`;
      await service.createTenantUsersTable(prefix);
      console.log(`Tenant users table '${tenantUsersTable}' created`);

      // 4️⃣ Insert tenant users
      if (Array.isArray(usersPayload) && usersPayload.length > 0) {
        const createdUsers = await service.createTenantUsers(tenantUsersTable, usersPayload);
        console.log(`Inserted ${createdUsers.length} users into '${tenantUsersTable}'`);
      }

      res.status(201).json({
        message: 'Company, payment info, and tenant users created successfully',
        company,
        users: usersPayload
      });

    } catch (err) {
      console.error('Error in createCompanyProfile:', err);
      next(err);
    }
  },
  getCompanyProfile: async (req, res, next) => { try { const profile = await service.getCompanyProfile(req.params.id); if (!profile) return notFound(res); return ok(res, profile);} catch (e) { next(e); }},
  updateCompanyProfile: async (req, res, next) => { try { const updated = await service.updateCompanyProfile(req.params.id, req.body); if (!updated) return notFound(res); return ok(res, updated); } catch (e) { next(e); }},
  removeCompanyProfile: async (req, res, next) => { try { await service.removeCompanyProfile(req.params.id); return noContent(res); } catch (e) { next(e); }},
createLocations: async (req, res, next) => {
  try {
    const name = req.body.company_name;
    if (!name) {
      return res.status(400).json({ error: 'Company name is required to generate table prefix' });
    }
    const prefix = name.toLowerCase().replace(/\s+/g, '_');
    const locations = req.body.locations;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Locations array is required' });
    }
    console.log('Tenant prefix:', prefix);
    const tableName = `${prefix}_location`;
    const created = await service.createLocations(tableName, locations);
    return res.json(created);
  } catch (e) {
    next(e);
  }
},


// Update company's subscription tier
updateCompanySubscription: async (req, res, next) => {
try {
const companyId = req.params.companyId;
const { pricing_tier } = req.body; // backend expects snake_case

const updatedCompany = await service.updateCompanyProfile(companyId, { pricing_tier });
return ok(res, updatedCompany);
} catch (e) { console.error('Error updating subscription tier:', e); next(e); } },

createPayment: async (req, res, next) => {
  try {
    const payload = { ...req.body, company_id: req.params.companyId };
    const created = await service.createPayment(payload);
    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (e) {
    console.error('Error creating payment:', e);
    next(e);
  }
},



updatePayment: async (req, res, next) => {
  try {
    const updated = await service.updatePayment(req.params.paymentId, req.body);
    return ok(res, updated);
  } catch (e) { next(e); }
},

getCompanyLogoByName: async (req, res) => {
  try {
    const { companyName, logoUrl } = req.body || {};

    if (!companyName) return res.status(400).json({ error: 'Company ID is required' });

    if (logoUrl) {
      // Save / update logo
      const updated = await saveCompanyLogo(companyName, logoUrl);
      return res.json(updated);
    } else {
      // Fetch logo
      const logo = await getCompanyLogo(companyName);
      return res.json({ logo });
    }
  } catch (err) {
    console.error('Error in logoHandler:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
},

getAllRbac: async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const records = await srv.getAllRbac(limit);
      return ok(res, records);
    } catch (e) { next(e); }
  },

  // Fetch RBAC by userId
  getRbacByUserId: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const record = await srv.getRbacByUserId(userId);
      return ok(res, record);
    } catch (e) { next(e); }
  },

  // Create RBAC for a user
  createRbac: async (req, res, next) => {
    try {
      const { userId, roles, permissions } = req.body;
      const record = await srv.addRbac(userId, roles, permissions);
      return ok(res, record);
    } catch (e) { next(e); }
  },

  // Update RBAC for a user
  updateRbac: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const { roles, permissions } = req.body;
      const record = await srv.modifyRbac(userId, roles, permissions);
      return ok(res, record);
    } catch (e) { next(e); }
  },


}