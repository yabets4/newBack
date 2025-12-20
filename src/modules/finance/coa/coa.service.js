import CoaModel from './coa.model.js';
import pool from '../../../loaders/db.loader.js';

export const CoaService = {
  // Create a new chart of account entry
  async createAccount(companyId, payload) {
    console.log('[CoaService] createAccount for', companyId, payload?.account_name);

    if (!payload || !payload.account_name) {
      throw new Error('account_name is required');
    }

    // Validate parent account if provided
    if (payload.parent_id) {
      const ok = await this.validateParentAccount(companyId, payload.parent_id);
      if (!ok) throw new Error('Parent account not found or invalid');
    }

    try {
      const inserted = await CoaModel.insert(companyId, payload);
      return inserted;
    } catch (err) {
      console.error('[CoaService] Error creating account', err);
      throw err;
    }
  },

  async updateAccount(companyId, accountId, payload) {
    console.log('[CoaService] updateAccount', accountId);
    const existing = await CoaModel.findById(companyId, accountId);
    if (!existing) return null;

    // Validate parent (prevent circular or self-parenting)
    if (payload.parent_id && payload.parent_id === accountId) {
      throw new Error('Account cannot be parent of itself');
    }
    if (payload.parent_id) {
      const ok = await this.validateParentAccount(companyId, payload.parent_id);
      if (!ok) throw new Error('Parent account not found or invalid');
    }

    try {
      // Merge existing DB row with the incoming payload so partial updates
      // don't overwrite required fields with null/undefined.
      const merged = {
        // keep DB column names where possible
        account_number: payload.account_number ?? existing.account_number,
        account_name: payload.account_name ?? existing.account_name,
        account_type: payload.account_type ?? existing.account_type,
        description: payload.description ?? existing.description,
        parent_id: payload.parent_id ?? existing.parent_id,
        balance: payload.balance ?? existing.balance ?? 0,
        is_cash_flow_relevant: payload.is_cash_flow_relevant ?? existing.is_cash_flow_relevant,
        is_control_account: payload.is_control_account ?? existing.is_control_account,
        is_system: payload.is_system ?? existing.is_system,
        status: payload.status ?? existing.status,
        report_group: payload.report_group ?? existing.report_group,
      };

      const updated = await CoaModel.update(companyId, accountId, merged);
      return updated;
    } catch (err) {
      console.error('[CoaService] Error updating account', err);
      throw err;
    }
  },

  async deleteAccount(companyId, accountId) {
    console.log('[CoaService] deleteAccount', accountId);
    const existing = await CoaModel.findById(companyId, accountId);
    if (!existing) return null;

    // Prevent deletion of system accounts
    this.preventDeletionOfSystemAccounts(existing);

    // Prevent deletion if has children
    const children = await pool.query(
      `SELECT account_id FROM chart_of_accounts WHERE company_id = $1 AND parent_id = $2 LIMIT 1`,
      [companyId, accountId]
    );
    if (children.rows.length > 0) throw new Error('Cannot delete account with child accounts');

    const deleted = await CoaModel.remove(companyId, accountId);
    return deleted;
  },

  async getAccounts(companyId) {
    return await CoaModel.findAll(companyId);
  },

  // Return hierarchical tree
  async getAccountTree(companyId) {
    const rows = await CoaModel.findAll(companyId);
    const map = new Map();
    rows.forEach(r => map.set(r.account_id, { ...r, children: [] }));
    const roots = [];
    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  },

  async validateParentAccount(companyId, parentId) {
    if (!parentId) return true;
    const parent = await CoaModel.findById(companyId, parentId);
    return !!parent;
  },

  preventDeletionOfSystemAccounts(accountRow) {
    if (accountRow.is_system) {
      const err = new Error('Cannot delete system account');
      err.code = 'SYSTEM_ACCOUNT';
      throw err;
    }
  },
};

export default CoaService;
