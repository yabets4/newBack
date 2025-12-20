import pool from '../loaders/db.loader.js';

function getUserId(req) {
    return (
        (req.auth && (req.auth.user || req.auth.sub || req.auth.userId || req.auth.user_id)) ||
        req.headers['x-user-id'] ||
        null
    );
}

function getCompanyId(req) {
    return (
        (req.auth && (req.auth.company || req.auth.company_id || req.auth.companyID || req.auth.org || req.auth.tenant)) ||
        req.headers['x-company-id'] ||
        null
    );
}

export default function auditMiddleware() {
    return function (req, res, next) {
        // Skip audit if request method is GET or OPTIONS
        if (req.method === 'GET' || req.method === 'OPTIONS') {
            return next();
        }

        const start = Date.now();

        // helpers attached to request to allow handlers to set before/after snapshots
        req.audit = req.audit || {};
        req.audit.setBefore = (data) => {
            try {
                req._auditBefore = data;
            } catch (e) {}
        };
        req.audit.setAfter = (data) => {
            try {
                res.locals.auditAfter = data;
            } catch (e) {}
        };

        // wrap res.send/res.json to capture response body for after_data
        const _origSend = res.send && res.send.bind(res);
        if (_origSend) {
            res.send = function sendWrapper(body) {
                try {
                    // try to parse JSON bodies
                    if (typeof body === 'string') {
                        try {
                            res.locals.auditAfter = JSON.parse(body);
                        } catch (e) {
                            res.locals.auditAfter = body;
                        }
                    } else if (body && typeof body === 'object') {
                        res.locals.auditAfter = body;
                    } else {
                        res.locals.auditAfter = body;
                    }
                } catch (e) {
                    // ignore parse errors
                    res.locals.auditAfter = body;
                }
                return _origSend(body);
            };
        }

        let finished = false;
        const doLog = async () => {
            if (finished) return;
            finished = true;
            try {
                const duration = Date.now() - start;
                const userId = getUserId(req);
                const companyId = getCompanyId(req);
                const endpoint = req.originalUrl || req.url || '';


                if (!userId || !companyId) {
                    return;
                }

                const recordId = (req.params && (req.params.id || req.params.record_id)) || (req.body && (req.body.id || req.body.record_id)) || null;
                const ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || null;
                const ua = req.get && req.get('User-Agent') || req.headers['user-agent'] || null;
                const action = req.method || null;
                let afterData = res.locals && res.locals.auditAfter ? res.locals.auditAfter : null;
                // Use req._auditBefore if controller set it, otherwise use req.body as the before snapshot.
                // Relying on req.body is deterministic (controller-provided payload) and avoids timing issues
                // where the DB row may already be updated when the middleware runs.
                let beforeData = req._auditBefore || (req.body && Object.keys(req.body).length ? req.body : null);
                if (beforeData) req._auditBefore = beforeData;
                const details = JSON.stringify({ status: res.statusCode, duration });

                const q = `INSERT INTO audit_logs (company_id, user_id, endpoint, record_id, ip_address, user_agent, action, before_data, after_data, details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
                const params = [
                    companyId,
                    userId,
                    endpoint,
                    recordId,
                    ip,
                    ua,
                    action,
                    beforeData ? JSON.stringify(beforeData) : null,
                    // if afterData is an object, pass it as JSON string — Postgres JSONB accepts text
                    afterData ? (typeof afterData === 'string' ? afterData : JSON.stringify(afterData)) : null,
                    details
                ];

                await pool.query(q, params);
            } catch (e) {
            }
        };

        res.on('finish', doLog);
        res.on('close', doLog);

        next();
    };
}
