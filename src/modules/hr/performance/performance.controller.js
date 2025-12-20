import PerformanceService from './performance.service.js';
import { ok, created, notFound, badRequest } from '../../../utils/apiResponse.js';
import { validateReviewPayload, validateFeedbackPayload } from './performance.validation.js';

const service = new PerformanceService();

export default class PerformanceController {
  // Reviews
  static async listReviews(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const opts = {
        employee_id: req.query.employee_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };
      const rows = await service.listReviews(companyId, opts);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  static async getReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const rec = await service.getReview(companyId, req.params.id);
      if (!rec) return notFound(res, 'Performance review not found');
      return ok(res, rec);
    } catch (e) {
      next(e);
    }
  }

  static async createReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      // Normalize common camelCase keys to snake_case expected by the model
      data.employee_id = data.employee_id ?? data.employeeId ?? data.employeeId;
      data.reviewer_id = data.reviewer_id ?? data.reviewerId ?? data.reviewerId;
      data.review_date = data.review_date ?? data.reviewDate ?? data.reviewDate;
      data.period_start = data.period_start ?? data.reviewPeriodStart ?? data.periodStart;
      data.period_end = data.period_end ?? data.reviewPeriodEnd ?? data.periodEnd;
      data.score = data.score ?? data.overallRating ?? data.overall_rating;
      data.summary = data.summary ?? data.overallComments ?? data.summary;

      const errors = validateReviewPayload(data);
      if (errors.length) return badRequest(res, errors.join('; '));
      const createdRec = await service.createReview(companyId, data);
      return created(res, createdRec);
    } catch (e) {
      next(e);
    }
  }

  static async updateReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const updated = await service.updateReview(companyId, req.params.id, req.body);
      if (!updated) return notFound(res, 'Performance review not found');
      return ok(res, updated);
    } catch (e) {
      next(e);
    }
  }

  static async deleteReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const result = await service.deleteReview(companyId, req.params.id);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }

  // Feedback
  static async listFeedback(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const opts = { employee_id: req.query.employee_id, limit: req.query.limit, offset: req.query.offset };
      const rows = await service.listFeedback(companyId, opts);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  static async getFeedback(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const rec = await service.getFeedback(companyId, req.params.id);
      if (!rec) return notFound(res, 'Feedback not found');
      return ok(res, rec);
    } catch (e) {
      next(e);
    }
  }

  static async createFeedback(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      // Normalize feedback keys
      data.from_employee_id = data.from_employee_id ?? data.fromEmployeeId ?? data.fromEmployee_id;
      data.to_employee_id = data.to_employee_id ?? data.toEmployeeId ?? data.toEmployee_id;
      data.content = data.content ?? data.message ?? data.details ?? data.content;

      const errors = validateFeedbackPayload(data);
      if (errors.length) return badRequest(res, errors.join('; '));
      const createdRec = await service.createFeedback(companyId, data);
      return created(res, createdRec);
    } catch (e) {
      next(e);
    }
  }

  static async deleteFeedback(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const result = await service.deleteFeedback(companyId, req.params.id);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }

  // Dashboard summary
  static async dashboard(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const result = await service.dashboard(companyId);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }
}
