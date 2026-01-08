import permission from '../../../middleware/permission.middleware.js';
import pool from '../../../loaders/db.loader.js';
import { Router } from 'express';

const r = Router();

// Protect these routes
// r.use(auth(true), );
const canRead = permission(['tenant.read.all', 'audit.read.all']); // High clearance

// GET / - list audit logs with optional filters and pagination
// Query params: user_id, endpoint, record_id, action, from, to, limit, offset
r.get('/', canRead, async (req, res, next) => {
	try {
		const q = [];
		const params = [];

		// Default to company from token when available
		const companyId = req.auth && req.auth.companyID ? req.auth.companyID : req.query.company_id;
		if (companyId) {
			params.push(companyId);
			q.push(`company_id = $${params.length}`);
		}

		const { user_id, endpoint, record_id, action, from, to } = req.query;
		if (user_id) {
			params.push(user_id);
			q.push(`user_id = $${params.length}`);
		}
		if (endpoint) {
			params.push(`%${endpoint}%`);
			q.push(`endpoint ILIKE $${params.length}`);
		}
		if (record_id) {
			params.push(record_id);
			q.push(`record_id = $${params.length}`);
		}
		if (action) {
			params.push(action.toUpperCase());
			q.push(`action = $${params.length}`);
		}
		if (from) {
			params.push(new Date(from));
			q.push(`created_at >= $${params.length}`);
		}
		if (to) {
			params.push(new Date(to));
			q.push(`created_at <= $${params.length}`);
		}

		const limit = Math.min(parseInt(req.query.limit || '50', 10), 500);
		const offset = parseInt(req.query.offset || '0', 10);

		let where = '';
		if (q.length) where = 'WHERE ' + q.join(' AND ');

		const sql = `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limit, offset);

		const result = await pool.query(sql, params);
		return res.json({ success: true, data: result.rows, meta: { limit, offset } });
	} catch (e) {
		next(e);
	}
});

// GET /:id - get a single audit entry by audit_id
r.get('/:id', canRead, async (req, res, next) => {
	try {
		const id = req.params.id;
		const companyId = req.auth && req.auth.companyID ? req.auth.companyID : null;
		const params = [];
		let sql = `SELECT * FROM audit_logs WHERE audit_id = $1`;
		params.push(id);
		if (companyId) {
			params.push(companyId);
			sql += ` AND company_id = $2`;
		}
		const result = await pool.query(sql, params);
		if (!result.rows || result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
		return res.json({ success: true, data: result.rows[0] });
	} catch (e) {
		next(e);
	}
});

export default r;
