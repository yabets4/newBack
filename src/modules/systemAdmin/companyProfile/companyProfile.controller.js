import CompanyService from './companyProfile.service.js';
import { ok, created, noContent, notFound } from '../../../utils/apiResponse.js';

export default class Controller {
  // --- CREATE
  static async createCompany(req, res, next) {
    try {
      const data = await CompanyService.createCompany(req.body);
      return created(res, data);
    } catch (e) {
      next(e);
    }
  }

  // --- READ (LIST)
  static async listCompanies(req, res, next) {
    try {
      const data = await CompanyService.listCompanies(req.query);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // --- READ (BY ID)
  static async getCompany(req, res, next) {
    try {
      const item = await CompanyService.getCompany(req.params.id);
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (e) {
      next(e);
    }
  }

  // --- UPDATE
  static async updateCompany(req, res, next) {
    try {
      const data = await CompanyService.updateCompany(req.params.id, req.body);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // --- DELETE
  static async deleteCompany(req, res, next) {
    try {
      await CompanyService.deleteCompany(req.params.id);
      return noContent(res);
    } catch (e) {
      next(e);
    }
  }

  // --- STATUS ACTIONS

  static async activateCompany(req, res, next) {
    try {
      const data = await CompanyService.activateCompany(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async suspendCompany(req, res, next) {
    try {
      const data = await CompanyService.suspendCompany(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async deactivateCompany(req, res, next) {
    try {
      const data = await CompanyService.deactivateCompany(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async setTrialCompany(req, res, next) {
    try {
      const data = await CompanyService.setTrialCompany(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
