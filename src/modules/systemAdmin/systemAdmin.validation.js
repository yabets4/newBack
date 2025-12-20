import Joi from 'joi';

export const createUserSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    role: Joi.string().default('user'),
    password: Joi.string().min(6).required()
  }).required()
});

export const updateUserSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email(),
    name: Joi.string(),
    role: Joi.string()
  }).min(1).required()
});

// --- Pricing Tiers ---
export const createPricingTierSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    monthlyPrice: Joi.number().required(),
    annualPrice: Joi.number().required(),
    includedUsers: Joi.number().required(),
    overageCostPerUser: Joi.number().required(),
    storageLimit: Joi.number().required(),
    supportLevel: Joi.string().required()
  }).required()
});

export const updatePricingTierSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    monthlyPrice: Joi.number(),
    annualPrice: Joi.number(),
    includedUsers: Joi.number(),
    overageCostPerUser: Joi.number(),
    storageLimit: Joi.number(),
    supportLevel: Joi.string()
  }).min(1).required()
});

// --- Pricing Features ---
export const createPricingFeatureSchema = Joi.object({
  body: Joi.object({
    tierId: Joi.number().required(),
    name: Joi.string().required(),
    enabled: Joi.boolean().default(true)
  }).required()
});

export const updatePricingFeatureSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    enabled: Joi.boolean()
  }).min(1).required()
});

export const createCompanyProfileSchema = Joi.object({
  body: Joi.object({
    companyName: Joi.string().required(),
    legalName: Joi.string().required(),
    regNumber: Joi.string().required(),
    physicalAddress: Joi.string().required(),
    defaultCurrency: Joi.string().required(),
    companyLogo: Joi.string().allow(null, ''),
    tinDocument: Joi.string().allow(null, ''),
    businessLicense: Joi.string().allow(null, ''),
    tradeLicense: Joi.string().allow(null, ''),
  }).required()
});

export const updateCompanyProfileSchema = Joi.object({
  body: Joi.object({
    companyName: Joi.string(),
    legalName: Joi.string(),
    regNumber: Joi.string(),
    physicalAddress: Joi.string(),
    defaultCurrency: Joi.string(),
    companyLogo: Joi.string().allow(null, ''),
    tinDocument: Joi.string().allow(null, ''),
    businessLicense: Joi.string().allow(null, ''),
    tradeLicense: Joi.string().allow(null, ''),
  }).min(1).required()
});

