
import * as srv from './user.service.js';
import { ok } from '../../../utils/apiResponse.js';

export default {
    // --- USERS ---
    getAllUsers: async (req, res, next) => {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const companyId = req.auth?.companyID || null;
            const users = await srv.getAllUsers(limit, offset, companyId);
            // Wrapper for consistency
            const meta = { limit, offset, total: users.length };
            return ok(res, { data: users, meta });
        } catch (e) { next(e); }
    },

    getUserById: async (req, res, next) => {
        try {
            const companyId = req.auth?.companyID || null;
            const user = await srv.getUserById(req.params.userId, companyId);
            return ok(res, user);
        } catch (e) { next(e); }
    },

    createUser: async (req, res, next) => {
        try {
            // If authenticated, prefer company from token when not provided in body
            const payload = { ...(req.body || {}) };
            const companyId = req.auth?.companyID || null;
            const created = await srv.createUser(payload, companyId);
            return ok(res, created);
        } catch (e) { next(e); }
    },

    updateUser: async (req, res, next) => {
        try {
            const payload = { ...(req.body || {}) };
            const companyId = req.auth?.companyID || null;
            const updated = await srv.updateUser(req.params.userId, payload, companyId);
            return ok(res, updated);
        } catch (e) { next(e); }
    },

    removeUser: async (req, res, next) => {
        try {
            const companyId = req.auth?.companyID || null;
            await srv.deleteUser(req.params.userId, companyId);
            return ok(res, null); // or return ok(res, { message: "User removed" })
        } catch (e) { next(e); }
    },
};
