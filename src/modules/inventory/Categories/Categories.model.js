import pool from '../../../loaders/db.loader.js';

export default class CategoriesModel {
	// ======= Categories =======
	static async createCategory(data) {
		try {
			const nextIdRes = await pool.query(`
				SELECT 'cat-' || LPAD((COALESCE(MAX(CAST(SPLIT_PART(category_id,'-',2) AS INT)),0)+1)::text, 3, '0') AS next_id
				FROM categories
				WHERE company_id = $1
			`, [data.company_id]);
			const category_id = nextIdRes.rows[0].next_id;

			const result = await pool.query(
				`INSERT INTO categories (company_id, category_id, name)
				 VALUES ($1,$2,$3)
				 RETURNING *`,
				[data.company_id, category_id, data.name]
			);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.createCategory error', err);
			throw err;
		}
	}

	static async fetchAllCategories(company_id) {
		try {
			const result = await pool.query(
				`SELECT * FROM categories WHERE company_id=$1 ORDER BY name ASC`,
				[company_id]
			);
			return result.rows;
		} catch (err) {
			console.error('CategoriesModel.fetchAllCategories error', err);
			throw err;
		}
	}

	static async fetchCategoryById(company_id, category_id) {
		try {
			const result = await pool.query(
				`SELECT * FROM categories WHERE company_id=$1 AND category_id=$2`,
				[company_id, category_id]
			);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.fetchCategoryById error', err);
			throw err;
		}
	}

	static async updateCategory(company_id, category_id, data) {
		try {
			const result = await pool.query(
				`UPDATE categories SET name=$1 WHERE company_id=$2 AND category_id=$3 RETURNING *`,
				[data.name, company_id, category_id]
			);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.updateCategory error', err);
			throw err;
		}
	}

	static async deleteCategory(company_id, category_id) {
		try {
			const result = await pool.query(
				`DELETE FROM categories WHERE company_id=$1 AND category_id=$2 RETURNING *`,
				[company_id, category_id]
			);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.deleteCategory error', err);
			throw err;
		}
	}

	// ======= Units Of Measure =======
	static async createUOM(data) {
		try {
			const nextIdRes = await pool.query(`
				SELECT 'uom-' || LPAD((COALESCE(MAX(CAST(SPLIT_PART(uom_id,'-',2) AS INT)),0)+1)::text, 3, '0') AS next_id
				FROM units_of_measure
				WHERE company_id = $1
			`, [data.company_id]);
			const uom_id = nextIdRes.rows[0].next_id;

			const result = await pool.query(
				`INSERT INTO units_of_measure (company_id, uom_id, name)
				 VALUES ($1,$2,$3) RETURNING *`,
				[data.company_id, uom_id, data.name]
			);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.createUOM error', err);
			throw err;
		}
	}

	static async fetchAllUOMs(company_id) {
		try {
			const result = await pool.query(`SELECT * FROM units_of_measure WHERE company_id=$1 ORDER BY name ASC`, [company_id]);
			return result.rows;
		} catch (err) {
			console.error('CategoriesModel.fetchAllUOMs error', err);
			throw err;
		}
	}

	static async fetchUOMById(company_id, uom_id) {
		try {
			const result = await pool.query(`SELECT * FROM units_of_measure WHERE company_id=$1 AND uom_id=$2`, [company_id, uom_id]);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.fetchUOMById error', err);
			throw err;
		}
	}

	static async updateUOM(company_id, uom_id, data) {
		try {
			const result = await pool.query(`UPDATE units_of_measure SET name=$1 WHERE company_id=$2 AND uom_id=$3 RETURNING *`, [data.name, company_id, uom_id]);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.updateUOM error', err);
			throw err;
		}
	}

	static async deleteUOM(company_id, uom_id) {
		try {
			const result = await pool.query(`DELETE FROM units_of_measure WHERE company_id=$1 AND uom_id=$2 RETURNING *`, [company_id, uom_id]);
			return result.rows[0];
		} catch (err) {
			console.error('CategoriesModel.deleteUOM error', err);
			throw err;
		}
	}
}

