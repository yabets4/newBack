import CompanyModel from './company.model.js';

export default class CompanyService {
  static async onboardCompany(formData) {
    const company = await CompanyModel.createCompany(formData);

    const owner = await CompanyModel.createUser({
      company_id: company.company_id,
      name: formData.owner_name,
      email: formData.owner_email,
      phone: formData.owner_phone,
      password: formData.owner_password,
      role: 'owner',
    });

    const subAdmin = await CompanyModel.createUser({
      company_id: company.company_id,
      name: formData.sub_admin_name,
      email: formData.sub_admin_email,
      phone: formData.sub_admin_phone,
      password: formData.sub_admin_password,
      role: 'sub_admin',
    });

    let payment = null;
    if (formData.billing_email) {
      payment = await CompanyModel.createPayment({
        company_id: company.company_id,
        billing_contact_name: formData.billing_contact_name,
        billing_email: formData.billing_email,
        billing_address: formData.billing_address,
        payment_method: formData.payment_method,
        payment_details: formData.payment_details,
      });
    }

    let locations = [];
    if (formData.locations && formData.locations.length > 0) {
      locations = await CompanyModel.createLocations(company.company_id, formData.locations);
    }

    return { company, users: [owner, subAdmin], payment, locations };
  }

  static async getAllCompanies() {
    return CompanyModel.fetchAllCompanies();
  }

  static async getCompanyById(company_id) {
    return CompanyModel.fetchCompanyById(company_id);
  }

  static async updateCompany(company_id, data) {
    return CompanyModel.updateCompany(company_id, data);
  }

  static async deleteCompany(company_id) {
    return CompanyModel.deleteCompany(company_id);
  }
}
