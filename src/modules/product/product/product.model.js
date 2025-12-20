import pool from '../../../loaders/db.loader.js';

export const ProductModel = {
	async findAll(companyId) {
		const q = `
			SELECT * FROM products
			WHERE company_id = $1
			ORDER BY created_at DESC
		`;
		const { rows } = await pool.query(q, [companyId]);
		return rows;
	},

	async findById(companyId, productId) {
		const q = `
			SELECT * FROM products
			WHERE company_id = $1 AND product_id = $2
			LIMIT 1
		`;
		const { rows } = await pool.query(q, [companyId, productId]);
		const product = rows[0] || null;
		if (!product) return null;

		// attach product_profile (media, image_url, description, specifications)
		try {
			const profileRes = await pool.query(`SELECT * FROM product_profile WHERE company_id = $1 AND product_id = $2 LIMIT 1`, [companyId, productId]);
			const profile = profileRes.rows[0] || null;
			if (profile) {
				if (profile.media) product.media = profile.media;
				if (profile.image_url) product.image_url = profile.image_url;
				if (profile.description) product.description = profile.description;
				if (profile.specifications) product.specifications = profile.specifications;
			}
		} catch (e) {
			// non-fatal: proceed without profile
			console.warn('Failed to load product_profile for', productId, e.message);
		}

		// attach variants
		try {
			const varRes = await pool.query(`SELECT * FROM product_variants WHERE company_id = $1 AND product_id = $2 ORDER BY created_at ASC`, [companyId, productId]);
			product.variants = (varRes.rows || []).map(r => ({
				id: r.variant_id,
				sku: r.sku,
				price: r.price,
				media: r.media,
				stock: r.stock,
				attributes: r.attributes ? (typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes) : null
			}));
		} catch (e) {
			console.warn('Failed to load product_variants for', productId, e.message);
			product.variants = [];
		}

		return product;
	},

	async insert(companyId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// generate product_id using companies.next_product_number if available
			// safely increment next_product_number even if stored as text
			const nextRes = await client.query(
				`UPDATE companies SET next_product_number = (COALESCE(NULLIF(next_product_number, ''), '0')::bigint + 1)::text WHERE company_id = $1 RETURNING next_product_number`,
				[companyId]
			);
			let nextNum = Date.now();
			if (nextRes.rows[0] && nextRes.rows[0].next_product_number) {
				// returned value is text; parse to integer
				nextNum = parseInt(nextRes.rows[0].next_product_number, 10) || nextNum;
			}
			const product_id = `PRD-${String(nextNum).padStart(3, '0')}`;

			const insertQ = `
				INSERT INTO products (
					company_id, product_id, product_name, sku, price, stock, description, category, status, uom, product_type, cost_price,
					length, width, height, dimension_unit, weight_value, weight_unit, tags, created_at, updated_at
				) VALUES (
					$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
				) RETURNING *
			`;

			const values = [
				companyId,
				product_id,
				data.name,
				data.sku,
				data.price || 0,
				data.stock || 0,
				data.description || null,
				data.category || null,
				data.status || 'Active',
				data.uom || null,
				data.product_type || null,
				data.cost_price || null,
				data.length || null,
				data.width || null,
				data.height || null,
				data.dimension_unit || null,
				data.weight_value || null,
				data.weight_unit || null,
				data.tags || null
			];

			const { rows } = await client.query(insertQ, values);
			const inserted = rows[0];

			// Persist variants if provided. Accept array or JSON string.
			if (data.variants) {
				let variants = data.variants;
				if (typeof variants === 'string') {
					try { variants = JSON.parse(variants); } catch (e) { variants = []; }
				}
				if (Array.isArray(variants) && variants.length > 0) {
					const insertVariantQ = `
						INSERT INTO product_variants (
							company_id, variant_id, product_id, sku, attributes, price, media, stock, created_at, updated_at
						) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
					`;
					for (const v of variants) {
						const attributes = {};
						if (v.color) attributes.color = v.color;
						if (v.material) attributes.material = v.material;
						if (v.attributes && typeof v.attributes === 'object') Object.assign(attributes, v.attributes);
						const mediaVal = v.media && typeof v.media === 'string' ? v.media : null;
						const vals = [
							companyId,
							v.id || v.variant_id || v.variantId || (v.variant_id = `V-${Date.now()}`),
							inserted.product_id,
							v.sku || null,
							Object.keys(attributes).length ? JSON.stringify(attributes) : null,
							v.price || null,
							mediaVal,
							v.stock || 0
						];
						await client.query(insertVariantQ, vals);
					}
				}
			}

			await client.query('COMMIT');
			return inserted;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	},

	async update(companyId, productId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			const q = `
				UPDATE products SET
					product_name = $1,
					sku = $2,
					price = $3,
					stock = $4,
					description = $5,
					category = $6,
					status = $7,
					uom = $8,
					product_type = $9,
					cost_price = $10,
					length = $11,
					width = $12,
					height = $13,
					dimension_unit = $14,
					weight_value = $15,
					weight_unit = $16,
					tags = $17,
					updated_at = NOW()
				WHERE company_id = $18 AND product_id = $19
				RETURNING *
			`;

			const values = [
				data.name || null,
				data.sku || null,
				data.price || null,
				data.stock || null,
				data.description || null,
				data.category || null,
				data.status || null,
				data.uom || null,
				data.product_type || null,
				data.cost_price || null,
				data.length || null,
				data.width || null,
				data.height || null,
				data.dimension_unit || null,
				data.weight_value || null,
				data.weight_unit || null,
				data.tags || null,
				companyId,
				productId
			];

			const { rows } = await client.query(q, values);
				const updated = rows[0];

				// If variants provided, replace existing variants for this product
				if (data.variants) {
					let variants = data.variants;
					if (typeof variants === 'string') {
						try { variants = JSON.parse(variants); } catch (e) { variants = []; }
					}
					// delete existing variants
					await client.query(`DELETE FROM product_variants WHERE company_id = $1 AND product_id = $2`, [companyId, productId]);
					if (Array.isArray(variants) && variants.length > 0) {
						const insertVariantQ = `
							INSERT INTO product_variants (
								company_id, variant_id, product_id, sku, attributes, price, media, stock, created_at, updated_at
							) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
						`;
						for (const v of variants) {
							const attributes = {};
							if (v.color) attributes.color = v.color;
							if (v.material) attributes.material = v.material;
							if (v.attributes && typeof v.attributes === 'object') Object.assign(attributes, v.attributes);
							const mediaVal = v.media && typeof v.media === 'string' ? v.media : null;
							const vals = [
								companyId,
								v.id || v.variant_id || v.variantId || (v.variant_id = `V-${Date.now()}`),
								productId,
								v.sku || null,
								Object.keys(attributes).length ? JSON.stringify(attributes) : null,
								v.price || null,
								mediaVal,
								v.stock || 0
							];
							await client.query(insertVariantQ, vals);
						}
					}
				}

				await client.query('COMMIT');
				return updated;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	},

	async updateStatus(companyId, productId, status) {
		const query = `
			UPDATE products SET
				status = $1,
				updated_at = NOW()
			WHERE company_id = $2 AND product_id = $3
			RETURNING *;
		`;
		const { rows } = await pool.query(query, [status, companyId, productId]);
		return rows[0];
	},

	async delete(companyId, productId) {
		const res = await pool.query(
			`DELETE FROM products WHERE company_id = $1 AND product_id = $2`,
			[companyId, productId]
		);
		return res.rowCount > 0;
	}
};

