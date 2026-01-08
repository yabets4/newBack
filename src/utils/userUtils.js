import pool from '../loaders/db.loader.js';

/**
 * Get user name from user ID
 * @param {string} userId - User ID like "USR-02"
 * @param {string} companyId - Company ID for multi-tenancy filtering
 * @returns {Promise<string>} User's full name or the ID if not found
 */
export async function getUserNameById(userId, companyId) {
    if (!userId) return 'Unknown User';

    try {
        // Try user_profiles table first (contains name field)
        const userQuery = await pool.query(
            `SELECT name FROM user_profiles WHERE user_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        if (userQuery.rows.length > 0) {
            return userQuery.rows[0].name || userId;
        }

        // Try admin_users table if not found in user_profiles (no company_id in admin table)
        const adminQuery = await pool.query(
            `SELECT name FROM admin_users WHERE user_id = $1`,
            [userId]
        );

        if (adminQuery.rows.length > 0) {
            return adminQuery.rows[0].name || userId;
        }

        // Try employees table as fallback (has 'name' field and company_id)
        const employeeQuery = await pool.query(
            `SELECT name FROM employees WHERE employee_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        if (employeeQuery.rows.length > 0) {
            return employeeQuery.rows[0].name || userId;
        }

        // Return the ID if no match found
        return userId;
    } catch (error) {
        console.error('Error fetching user name:', error);
        return userId; // Fallback to ID on error
    }
}
