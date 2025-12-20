import service from './crm.service.js';
import { ok, created, noContent, notFound } from '../../utils/apiResponse.js';

export default {
  list: async (req, res, next) => {
    try {
      const data = await service.list(req.tenantPrefix, req.query);
      return ok(res, data);
    } catch (e) { next(e); }
  },
  get: async (req, res, next) => {
    try {
      const item = await service.get(req.tenantPrefix, req.params.id);
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const createdItem = await service.create(req.tenantPrefix, req.body);
      return created(res, createdItem);
    } catch (e) { next(e); }
  },
  
  update: async (req, res, next) => {
    try {
      const updated = await service.update(req.tenantPrefix, req.params.id, req.body);
      if (!updated) return notFound(res);
      return ok(res, updated);
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      await service.remove(req.tenantPrefix, req.params.id);
      return noContent(res);
    } catch (e) { next(e); }
  },
};
