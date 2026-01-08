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

      const insertQ = `INSERT INTO performance_reviews (
        company_id, review_id, employee_id, employee_name, reviewer_id, reviewer_name, review_date, period_start, period_end,
        ratings, goals, development_plan, overall_rating, overall_comments, attachments, summary, details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`;

      const ratingsVal = data.ratings ? JSON.stringify(data.ratings) : null;
      const goalsVal = data.goals ? JSON.stringify(data.goals) : null;
      const attachmentsVal = data.attachments ? JSON.stringify(data.attachments) : null;

      const { rows } = await client.query(insertQ, [
        companyId,
        review_id,
        data.employee_id,
        data.employee_name || null,
        data.reviewer_id || null,
        data.reviewer_name || null,
        data.review_date || null,
        data.period_start || null,
        data.period_end || null,
        ratingsVal,
        goalsVal,
        data.development_plan || data.developmentPlan || null,
        data.overall_rating ?? data.overallRating ?? null,
        data.overall_comments ?? data.overallComments ?? null,
        attachmentsVal,
        data.summary || null,
        data.details || null
      ]);

      await client.query('COMMIT');
      return rows[0];
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
    const clauses = ['r.company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`r.employee_id = $${idx++}`);
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
    const q = `
      SELECT r.* 
      FROM performance_reviews r
      ${where} 
      ORDER BY r.review_date DESC, r.created_at DESC 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findReviewById(companyId, reviewId) {
    const { rows } = await pool.query(
      `SELECT r.* 
       FROM performance_reviews r
       WHERE r.company_id = $1 AND r.review_id = $2`,
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
      const allowed = ['employee_id', 'employee_name', 'reviewer_id', 'reviewer_name', 'review_date', 'period_start', 'period_end', 'ratings', 'goals', 'development_plan', 'overall_rating', 'overall_comments', 'attachments', 'summary', 'details'];
      for (const k of allowed) {
        if (k in data) {
          fields.push(`${k} = $${idx++}`);
          // stringify JSON fields
          if (k === 'ratings' || k === 'goals' || k === 'attachments') {
            params.push(data[k] != null ? JSON.stringify(data[k]) : null);
          } else if (k === 'development_plan' && data.developmentPlan !== undefined) {
            params.push(data.developmentPlan);
          } else if (k === 'overall_rating' && data.overallRating !== undefined) {
            params.push(data.overallRating);
          } else if (k === 'overall_comments' && data.overallComments !== undefined) {
            params.push(data.overallComments);
          } else {
            params.push(data[k]);
          }
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
    const clauses = ['f.company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`(from_employee_id = $${idx} OR to_employee_id = $${idx})`);
      params.push(employee_id);
      idx++;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `
      SELECT f.*, 
             e1.name as from_employee_name, 
             e2.name as to_employee_name
      FROM performance_feedback f
      LEFT JOIN employees e1 ON f.company_id = e1.company_id AND f.from_employee_id = e1.employee_id
      LEFT JOIN employees e2 ON f.company_id = e2.company_id AND f.to_employee_id = e2.employee_id
      ${where} 
      ORDER BY f.date DESC, f.created_at DESC 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
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
    // Provide aggregates: total reviews, average score, feedback counts, and reviews due soon
    const { rows } = await pool.query(
      `SELECT
         (SELECT COALESCE(COUNT(*), 0) FROM performance_reviews WHERE company_id = $1) AS total_reviews,
         (SELECT ROUND(COALESCE(AVG(overall_rating), 0), 2) FROM performance_reviews WHERE company_id = $1) AS avg_score,
         (SELECT COALESCE(COUNT(*), 0) FROM performance_feedback WHERE company_id = $1) AS total_feedback,
         (
           SELECT COUNT(*)
           FROM employee_employment_details
           WHERE company_id = $1
             AND (
               -- Check if anniversary is within the next 30 days
               (date_part('month', hire_date), date_part('day', hire_date)) >= (date_part('month', CURRENT_DATE), date_part('day', CURRENT_DATE))
               AND
               (hire_date + (date_part('year', CURRENT_DATE) - date_part('year', hire_date)) * interval '1 year') <= (CURRENT_DATE + interval '30 days')
             )
         ) AS reviews_due_soon
       `,
      [companyId]
    );
    return rows[0] || { total_reviews: 0, avg_score: 0, total_feedback: 0, reviews_due_soon: 0 };
  }
};
