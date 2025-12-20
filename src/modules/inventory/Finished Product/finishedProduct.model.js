
import pool from '../../../loaders/db.loader.js';

export const FinishedProductModel = {
	async findAll(companyId) {
		const q = `
			SELECT * FROM finished_products
			WHERE company_id = $1
			ORDER BY created_at DESC
		`;
		const { rows } = await pool.query(q, [companyId]);
		return rows;
	},

	async findById(companyId, finishedProductId) {
		const q = `
			SELECT * FROM finished_products
			WHERE company_id = $1 AND finished_product_id = $2
			LIMIT 1
		`;
		const { rows } = await pool.query(q, [companyId, finishedProductId]);
		return rows[0] || null;
	},

	async insert(companyId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// generate finished_product_id using companies.next_product_number if available
			const nextRes = await client.query(
				`UPDATE companies SET next_product_number = (COALESCE(NULLIF(next_product_number, ''), '0')::bigint + 1)::text WHERE company_id = $1 RETURNING next_product_number`,
				[companyId]
			);
			let nextNum = Date.now();
			if (nextRes.rows[0] && nextRes.rows[0].next_product_number) {
				nextNum = parseInt(nextRes.rows[0].next_product_number, 10) || nextNum;
			}
			const finished_product_id = `FGD-${String(nextNum).padStart(3, '0')}`;

			const insertQ = `
				INSERT INTO finished_products (
					company_id, finished_product_id, product_id, product_name, sku, quantity, location, lot_number, serial_number, cost_price, selling_price, materials_used, status, uom, tags, created_at, updated_at
				) VALUES (
					$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW()
				) RETURNING *
			`;

			let materials = data.materials_used || null;
			if (typeof materials === 'string') {
				try { materials = JSON.parse(materials); } catch (e) { materials = null; }
			}

			const values = [
				companyId,
				finished_product_id,
				data.product_id || null,
				data.name || null,
				data.sku || null,
				data.quantity || 0,
				data.location || null,
				data.lot_number || null,
				data.serial_number || null,
				data.cost_price || null,
				data.selling_price || null,
				materials,
				data.status || 'Available',
				data.uom || null,
				data.tags || null
			];

			const { rows } = await client.query(insertQ, values);
			await client.query('COMMIT');
			return rows[0];
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	},

	async update(companyId, finishedProductId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			const q = `
				UPDATE finished_products SET
					product_id = $1,
					product_name = $2,
					sku = $3,
					quantity = $4,
					location = $5,
					lot_number = $6,
					serial_number = $7,
					cost_price = $8,
					selling_price = $9,
					materials_used = $10,
					status = $11,
					uom = $12,
					tags = $13,
					updated_at = NOW()
				WHERE company_id = $14 AND finished_product_id = $15
				RETURNING *
			`;

			let materials = data.materials_used || null;
			if (typeof materials === 'string') {
				try { materials = JSON.parse(materials); } catch (e) { materials = null; }
			}

			const values = [
				data.product_id || null,
				data.name || null,
				data.sku || null,
				data.quantity || null,
				data.location || null,
				data.lot_number || null,
				data.serial_number || null,
				data.cost_price || null,
				data.selling_price || null,
				materials,
				data.status || null,
				data.uom || null,
				data.tags || null,
				companyId,
				finishedProductId
			];

			const { rows } = await client.query(q, values);
			await client.query('COMMIT');
			return rows[0];
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	},

	async updateStatus(companyId, finishedProductId, status) {
		const q = `
			UPDATE finished_products SET
				status = $1,
				updated_at = NOW()
			WHERE company_id = $2 AND finished_product_id = $3
			RETURNING *
		`;
		const { rows } = await pool.query(q, [status, companyId, finishedProductId]);
		return rows[0];
	},

	async delete(companyId, finishedProductId) {
		const res = await pool.query(
			`DELETE FROM finished_products WHERE company_id = $1 AND finished_product_id = $2`,
			[companyId, finishedProductId]
		);
		return res.rowCount > 0;
	}
};
