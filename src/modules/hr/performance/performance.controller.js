import PerformanceService from './performance.service.js';
import { ok, created, notFound, badRequest } from '../../../utils/apiResponse.js';
import { validateReviewPayload, validateFeedbackPayload } from './performance.validation.js';
import { getEmployeeName } from './performance.utils.js';

const service = new PerformanceService();

function mapReviewRowToDto(row) {
  if (!row) return null;
  return {
    reviewId: row.review_id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    reviewDate: row.review_date ? (typeof row.review_date === 'string' ? row.review_date.slice(0, 10) : row.review_date.toISOString().slice(0, 10)) : null,
    reviewPeriodStart: row.period_start ? (typeof row.period_start === 'string' ? row.period_start.slice(0, 10) : row.period_start.toISOString().slice(0, 10)) : null,
    reviewPeriodEnd: row.period_end ? (typeof row.period_end === 'string' ? row.period_end.slice(0, 10) : row.period_end.toISOString().slice(0, 10)) : null,
    performanceRatings: row.ratings || row.details || {},
    overallRating: row.overall_rating ?? row.score ?? null,
    overallComments: row.overall_comments ?? row.summary ?? null,
    goals: row.goals || [],
    developmentPlan: row.development_plan || '',
    attachments: row.attachments || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

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
      const dto = Array.isArray(rows) ? rows.map(mapReviewRowToDto) : rows;
      return ok(res, dto);
    } catch (e) {
      next(e);
    }
  }

  static async getReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const rec = await service.getReview(companyId, req.params.id);
      if (!rec) return notFound(res, 'Performance review not found');
      return ok(res, mapReviewRowToDto(rec));
    } catch (e) {
      next(e);
    }
  }

  static async createReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const src = { ...req.body };

      // Resolve employee and reviewer names
      const employeeId = src.employee_id ?? src.employeeId;
      const reviewerId = src.reviewer_id ?? src.reviewerId ?? req.auth.user;

      const employeeName = await getEmployeeName(companyId, employeeId);
      const reviewerName = await getEmployeeName(companyId, reviewerId);

      const data = {
        employee_id: employeeId,
        employee_name: employeeName,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        review_date: src.review_date ?? src.reviewDate,
        period_start: src.period_start ?? src.reviewPeriodStart ?? src.periodStart,
        period_end: src.period_end ?? src.reviewPeriodEnd ?? src.periodEnd,
        ratings: src.ratings ?? src.performanceRatings ?? src.performance_ratings ?? null,
        goals: src.goals ?? src.goals ?? null,
        developmentPlan: src.developmentPlan ?? src.development_plan ?? null,
        overallRating: src.overallRating ?? src.overall_rating ?? null,
        overallComments: src.overallComments ?? src.overall_comments ?? null,
        attachments: src.attachments ?? null,
        summary: src.summary ?? null,
        details: src.details ?? null
      };

      const errors = validateReviewPayload(data);
      if (errors.length) return badRequest(res, errors.join('; '));
      const createdRec = await service.createReview(companyId, data);
      return created(res, mapReviewRowToDto(createdRec));
    } catch (e) {
      next(e);
    }
  }

  static async updateReview(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const src = { ...req.body };

      // Resolve employee and reviewer names if IDs are provided
      const employeeId = src.employee_id ?? src.employeeId;
      const reviewerId = src.reviewer_id ?? src.reviewerId ?? req.auth.user;

      const employeeName = employeeId ? await getEmployeeName(companyId, employeeId) : undefined;
      const reviewerName = reviewerId ? await getEmployeeName(companyId, reviewerId) : undefined;

      const data = {
        employee_id: employeeId,
        employee_name: employeeName,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        review_date: src.review_date ?? src.reviewDate,
        period_start: src.period_start ?? src.reviewPeriodStart ?? src.periodStart,
        period_end: src.period_end ?? src.reviewPeriodEnd ?? src.periodEnd,
        ratings: src.ratings ?? src.performanceRatings ?? src.performance_ratings,
        goals: src.goals ?? src.goals,
        developmentPlan: src.developmentPlan ?? src.development_plan,
        overallRating: src.overallRating ?? src.overall_rating,
        overallComments: src.overallComments ?? src.overall_comments,
        attachments: src.attachments
      };

      const updated = await service.updateReview(companyId, req.params.id, data);
      if (!updated) return notFound(res, 'Performance review not found');
      return ok(res, mapReviewRowToDto(updated));
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
