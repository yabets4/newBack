import {
  fetchCompanyLogoByName,
  upsertCompanyLogo,
  fetchAllCompanyLogos
} from './rbac.model.js';

export const getCompanyLogo = async (companyName) => {
  if (!companyName) throw new Error('Company ID is required');
  const logoUrl = await fetchCompanyLogoByName(companyName);
  return logoUrl;
};

export const saveCompanyLogo = async (companyName, logoUrl) => {
  if (!companyName) throw new Error('Company ID is required');
  if (!logoUrl) throw new Error('Logo URL is required');

  const updatedLogo = await upsertCompanyLogo(companyName, logoUrl);
  return updatedLogo;
};

export const getAllCompanyLogos = async (limit = 50) => {
  const logos = await fetchAllCompanyLogos(limit);
  return logos;
};
