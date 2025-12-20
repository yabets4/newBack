import service from './notification.service.js';
import { ok, created, noContent, notFound } from '../../utils/apiResponse.js';

export default {
  list: async (req,res,next)=>{ try{ return ok(res, await service.list(req.tenantPrefix, req.query)); }catch(e){ next(e);} },
  get: async (req,res,next)=>{ try{ const r=await service.get(req.tenantPrefix, req.params.id); return r?ok(res,r):notFound(res);}catch(e){ next(e);} },
  create: async (req,res,next)=>{ try{ return created(res, await service.create(req.tenantPrefix, req.body)); }catch(e){ next(e);} },
  update: async (req,res,next)=>{ try{ const r=await service.update(req.tenantPrefix, req.params.id, req.body); return r?ok(res,r):notFound(res);}catch(e){ next(e);} },
  remove: async (req,res,next)=>{ try{ await service.remove(req.tenantPrefix, req.params.id); return noContent(res);}catch(e){ next(e);} },
};
