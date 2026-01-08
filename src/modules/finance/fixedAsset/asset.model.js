// src/modules/systemAdmin/assets/asset.model.js
import pool from '../../../loaders/db.loader.js';

export const AssetsModel = {
  async findAll(companyId) {
    const result = await pool.query(
      `
      SELECT *
      FROM assets
      WHERE company_id = $1
      ORDER BY created_at DESC
      `,
      [companyId]
    );
    return result.rows;
  },
  async findAllLocation(companyId) {
    // --- Fetch locations ---
    const locationsResult = await pool.query(
      `
    SELECT 
      l.id,

      l.name,
      l.address,
      l.contact,
      l.operational_hours,
      l.created_at,
      l.updated_at
    FROM locations l
    WHERE l.company_id = $1
    ORDER BY l.created_at DESC
    `,
      [companyId]
    );
    return locationsResult.rows;
  },

  async findById(companyId, assetId) {
    const result = await pool.query(
      `
      SELECT *
      FROM assets
      WHERE company_id = $1
        AND asset_id = $2
      LIMIT 1
      `,
      [companyId, assetId]
    );
    return result.rows[0];
  },

  // Calculate depreciation for one or all assets in a company
  async depreciation(companyId, assetId = null) {
    const params = assetId ? [companyId, assetId] : [companyId];
    const q = assetId
      ? `SELECT * FROM assets WHERE company_id = $1 AND asset_id = $2`
      : `SELECT * FROM assets WHERE company_id = $1`;

    const result = await pool.query(q, params);
    const rows = result.rows;
    const now = new Date();

    return rows.map((a) => {
      const acq = a.acquisition_date ? new Date(a.acquisition_date) : null;
      let yearsElapsed = 0;
      if (acq) {
        yearsElapsed = now.getFullYear() - acq.getFullYear();
        const monthDiff = now.getMonth() - acq.getMonth();
        const dayDiff = now.getDate() - acq.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) yearsElapsed--;
        if (yearsElapsed < 0) yearsElapsed = 0;
      }

      const useful = Number(a.useful_life_years) || 0;
      const acquisitionValue = Number(a.acquisition_value) || 0;

      const annualDep = useful > 0 ? acquisitionValue / useful : 0;
      let accumulated = annualDep * yearsElapsed;
      if (accumulated > acquisitionValue) accumulated = acquisitionValue;
      const netBook = Math.max(acquisitionValue - accumulated, 0);

      return {
        ...a,
        years_elapsed: yearsElapsed,
        annual_depreciation: Number(annualDep.toFixed(2)),
        accumulated_depreciation: Number(accumulated.toFixed(2)),
        net_book_value: Number(netBook.toFixed(2)),
      };
    });
  },

  // Find assets that appear to have been disposed
  async findDisposals(companyId) {
    const result = await pool.query(
      `
      SELECT *
      FROM assets
      WHERE company_id = $1
        AND (LOWER(status) LIKE '%dispose%' OR LOWER(status) = 'disposed')
      ORDER BY created_at DESC
      `,
      [companyId]
    );
    return result.rows;
  },

  async insert(companyId, data, externalClient = null) {
    const client = externalClient || await pool.connect();
    const shouldRelease = !externalClient;
    try {
      if (shouldRelease) await client.query("BEGIN");

      // Generate next asset number
      const nextNumRes = await client.query(
        `UPDATE companies
         SET next_asset_number = next_asset_number + 1
         WHERE company_id = $1
         RETURNING next_asset_number`,
        [companyId]
      );
      const nextNum = nextNumRes.rows[0].next_asset_number;
      const assetId = `ASSET-${String(nextNum).padStart(3, "0")}`;

      // Insert into assets
      const res = await client.query(
        `INSERT INTO assets (
          company_id, asset_id, asset_name, category, serial_number,location,  status, assigned_to,
          acquisition_date, acquisition_value, current_value, depreciation_method, useful_life_years, notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          companyId,
          assetId,
          data.asset_name,
          data.category,
          data.serial_number,
          data.location,
          data.status || 'Active', // Default status
          data.assigned_to || null,
          data.acquisition_date,
          data.acquisition_value,
          data.current_value || null,
          data.depreciation_method,
          data.useful_life_years,
          data.notes || null
        ]
      );


      if (shouldRelease) await client.query("COMMIT");
      return res.rows[0];
    } catch (err) {
      if (shouldRelease) await client.query("ROLLBACK");
      throw err;
    } finally {
      if (shouldRelease) client.release();
    }
  },

  async update(companyId, assetId, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (let key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }

    values.push(companyId, assetId);

    const result = await pool.query(
      `UPDATE assets
       SET ${fields.join(", ")}
       WHERE company_id = $${idx} AND asset_id = $${idx + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(companyId, assetId) {
    const result = await pool.query(
      `DELETE FROM assets
       WHERE company_id = $1 AND asset_id = $2
       RETURNING *`,
      [companyId, assetId]
    );
    return result.rows[0];
  },

  async updateStatus(companyId, assetId, status) {
    const res = await pool.query(`UPDATE assets SET status = $3, updated_at = NOW() WHERE company_id = $1 AND asset_id = $2 RETURNING *`, [companyId, assetId, status]);
    return res.rows[0];
  }
};
