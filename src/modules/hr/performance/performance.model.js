import pool from '../../../loaders/db.loader.js';
import { v4 as uuidv4 } from 'uuid';

export const PerformanceModel = {
  // Reviews
  async createReview(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let review_id = data.review_id;
      if (!review_id) {
        review_id = `PR-${uuidv4()}`;
      }

      await client.query(
        `INSERT INTO performance_reviews (
          company_id, review_id, employee_id, reviewer_id, review_date, period_start, period_end, score, summary, details
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          companyId,
          review_id,
          data.employee_id,
          data.reviewer_id || null,
          data.review_date || null,
          data.period_start || null,
          data.period_end || null,
          data.score || null,
          data.summary || null,
          data.details || null
        ]
      );

      await client.query('COMMIT');
      return { review_id, ...data };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PerformanceModel.createReview error', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async findReviews(companyId, opts = {}) {
    const { employee_id, start_date, end_date, limit = 100, offset = 0 } = opts;
    const clauses = ['company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`employee_id = $${idx++}`);
      params.push(employee_id);
    }
    if (start_date) {
      clauses.push(`review_date >= $${idx++}`);
      params.push(start_date);
    }
    if (end_date) {
      clauses.push(`review_date <= $${idx++}`);
      params.push(end_date);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `SELECT * FROM performance_reviews ${where} ORDER BY review_date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findReviewById(companyId, reviewId) {
    const { rows } = await pool.query(
      `SELECT * FROM performance_reviews WHERE company_id = $1 AND review_id = $2`,
      [companyId, reviewId]
    );
    return rows[0] || null;
  },

  async updateReview(companyId, reviewId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fields = [];
      const params = [companyId, reviewId];
      let idx = 3;
      const allowed = ['employee_id','reviewer_id','review_date','period_start','period_end','score','summary','details'];
      for (const k of allowed) {
        if (k in data) {
          fields.push(`${k} = $${idx++}`);
          params.push(data[k]);
        }
      }
      if (fields.length === 0) return null;
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      const q = `UPDATE performance_reviews SET ${fields.join(', ')} WHERE company_id = $1 AND review_id = $2 RETURNING *`;
      const { rows } = await client.query(q, params);
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PerformanceModel.updateReview error', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async deleteReview(companyId, reviewId) {
    const { rowCount } = await pool.query(
      `DELETE FROM performance_reviews WHERE company_id = $1 AND review_id = $2`,
      [companyId, reviewId]
    );
    return rowCount > 0;
  },

  // Feedback
  async createFeedback(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let feedback_id = data.feedback_id;
      if (!feedback_id) {
        feedback_id = `FB-${uuidv4()}`;
      }

      await client.query(
        `INSERT INTO performance_feedback (
          company_id, feedback_id, from_employee_id, to_employee_id, date, type, content
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          companyId,
          feedback_id,
          data.from_employee_id || null,
          data.to_employee_id || null,
          data.date || null,
          data.type || null,
          data.content || null
        ]
      );

      await client.query('COMMIT');
      return { feedback_id, ...data };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PerformanceModel.createFeedback error', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async findFeedback(companyId, opts = {}) {
    const { employee_id, limit = 100, offset = 0 } = opts;
    const clauses = ['company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`(from_employee_id = $${idx} OR to_employee_id = $${idx})`);
      params.push(employee_id);
      idx++;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `SELECT * FROM performance_feedback ${where} ORDER BY date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findFeedbackById(companyId, feedbackId) {
    const { rows } = await pool.query(
      `SELECT * FROM performance_feedback WHERE company_id = $1 AND feedback_id = $2`,
      [companyId, feedbackId]
    );
    return rows[0] || null;
  },

  async deleteFeedback(companyId, feedbackId) {
    const { rowCount } = await pool.query(
      `DELETE FROM performance_feedback WHERE company_id = $1 AND feedback_id = $2`,
      [companyId, feedbackId]
    );
    return rowCount > 0;
  },

  async dashboardSummary(companyId) {
    // Provide simple aggregates: total reviews, average score, feedback counts
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM performance_reviews WHERE company_id = $1) AS total_reviews,
         (SELECT AVG(score) FROM performance_reviews WHERE company_id = $1) AS avg_score,
         (SELECT COUNT(*) FROM performance_feedback WHERE company_id = $1) AS total_feedback
       `,
      [companyId]
    );
    return rows[0] || { total_reviews: 0, avg_score: null, total_feedback: 0 };
  }
};
