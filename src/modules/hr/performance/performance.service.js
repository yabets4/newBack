import { PerformanceModel } from './performance.model.js';

export default class PerformanceService {
  async listReviews(companyId, opts = {}) {
    try {
      return await PerformanceModel.findReviews(companyId, opts);
    } catch (err) {
      console.error('PerformanceService.listReviews error', err);
      throw new Error('Could not fetch performance reviews');
    }
  }

  async getReview(companyId, reviewId) {
    try {
      const rec = await PerformanceModel.findReviewById(companyId, reviewId);
      if (!rec) throw new Error('Review not found');
      return rec;
    } catch (err) {
      console.error('PerformanceService.getReview error', err);
      throw err;
    }
  }

  async createReview(companyId, data) {
    try {
      return await PerformanceModel.createReview(companyId, data);
    } catch (err) {
      console.error('PerformanceService.createReview error', err);
      throw err;
    }
  }

  async updateReview(companyId, reviewId, data) {
    try {
      const updated = await PerformanceModel.updateReview(companyId, reviewId, data);
      if (!updated) throw new Error('Review not found or update failed');
      return updated;
    } catch (err) {
      console.error('PerformanceService.updateReview error', err);
      throw err;
    }
  }

  async deleteReview(companyId, reviewId) {
    try {
      const deleted = await PerformanceModel.deleteReview(companyId, reviewId);
      if (!deleted) throw new Error('Review not found or could not delete');
      return { success: true };
    } catch (err) {
      console.error('PerformanceService.deleteReview error', err);
      throw err;
    }
  }

  // Feedback
  async listFeedback(companyId, opts = {}) {
    try {
      return await PerformanceModel.findFeedback(companyId, opts);
    } catch (err) {
      console.error('PerformanceService.listFeedback error', err);
      throw new Error(`Could not fetch feedback: ${err.message}`);
    }
  }

  async getFeedback(companyId, feedbackId) {
    try {
      const rec = await PerformanceModel.findFeedbackById(companyId, feedbackId);
      if (!rec) throw new Error('Feedback not found');
      return rec;
    } catch (err) {
      console.error('PerformanceService.getFeedback error', err);
      throw err;
    }
  }

  async createFeedback(companyId, data) {
    try {
      return await PerformanceModel.createFeedback(companyId, data);
    } catch (err) {
      console.error('PerformanceService.createFeedback error', err);
      throw new Error('Could not create feedback');
    }
  }

  async deleteFeedback(companyId, feedbackId) {
    try {
      const deleted = await PerformanceModel.deleteFeedback(companyId, feedbackId);
      if (!deleted) throw new Error('Feedback not found or could not delete');
      return { success: true };
    } catch (err) {
      console.error('PerformanceService.deleteFeedback error', err);
      throw err;
    }
  }

  async dashboard(companyId) {
    try {
      return await PerformanceModel.dashboardSummary(companyId);
    } catch (err) {
      console.error('PerformanceService.dashboard error', err);
      throw new Error('Could not fetch dashboard');
    }
  }
}
