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
				if (profile.specifications) {
					// Specifications may hold configurable attributes for templates.
					// Try to parse JSON strings into objects, but fall back to raw value.
					try {
						product.configurableAttributes = typeof profile.specifications === 'string' ? JSON.parse(profile.specifications) : profile.specifications;
					} catch (e) {
						product.configurableAttributes = profile.specifications;
					}
				}
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

			// generate a simple unique product_id (do not touch companies.next_product_number)
			const uniq = `${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
			const product_id = `PRD-${uniq}`;

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
				data.cost_price || 0,
				data.length || 0,
				data.width || 0,
				data.height || 0,
				data.dimension_unit || null,
				data.weight_value || 0,
				data.weight_unit || null,
				data.tags || null
			];
			console.log("product Data", values);
			

			const { rows } = await client.query(insertQ, values);
			const inserted = rows[0];

			// persist product_profile (media / image_url / description / specifications) if provided
			try {
				if (data.image_urls || data.image_url || data.description || data.specifications || data.configurableAttributes) {
					const mediaVal = data.image_urls ? JSON.stringify(data.image_urls) : (data.media ? JSON.stringify(data.media) : null);
					const imageUrlVal = data.image_url || (Array.isArray(data.image_urls) && data.image_urls[0]) || null;
					const descVal = data.description || null;
					let specsVal = null;
					if (data.specifications) {
						specsVal = typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications;
					} else if (data.configurableAttributes) {
						specsVal = typeof data.configurableAttributes === 'object' ? JSON.stringify(data.configurableAttributes) : data.configurableAttributes;
					}
					await client.query(
						`INSERT INTO product_profile (company_id, product_id, description, specifications, media, image_url, created_at, updated_at)
						 VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
						[companyId, inserted.product_id, descVal, specsVal, mediaVal, imageUrlVal]
					);
				}
			} catch (e) {
				console.warn('Failed to persist product_profile for', inserted && inserted.product_id, e.message);
			}

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

						// persist/update product_profile (media / image_url / description / specifications) if provided
						try {
							if (data.image_urls || data.image_url || data.description || data.specifications || data.configurableAttributes) {
								const mediaVal = data.image_urls ? JSON.stringify(data.image_urls) : (data.media ? JSON.stringify(data.media) : null);
								const imageUrlVal = data.image_url || (Array.isArray(data.image_urls) && data.image_urls[0]) || null;
								const descVal = data.description || null;
								let specsVal = null;
								if (data.specifications) {
									specsVal = typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications;
								} else if (data.configurableAttributes) {
									specsVal = typeof data.configurableAttributes === 'object' ? JSON.stringify(data.configurableAttributes) : data.configurableAttributes;
								}
								const profRes = await client.query('SELECT id FROM product_profile WHERE company_id = $1 AND product_id = $2 LIMIT 1', [companyId, productId]);
								if (profRes.rows[0]) {
									await client.query(`UPDATE product_profile SET description = $1, specifications = $2, media = $3, image_url = $4, updated_at = NOW() WHERE company_id = $5 AND product_id = $6`, [descVal, specsVal, mediaVal, imageUrlVal, companyId, productId]);
								} else {
									await client.query(`INSERT INTO product_profile (company_id, product_id, description, specifications, media, image_url, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`, [companyId, productId, descVal, specsVal, mediaVal, imageUrlVal]);
								}
							}
						} catch (e) {
							console.warn('Failed to persist product_profile for', productId, e.message);
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

