import DesignService from './design.service.js';
import { ok, created, badRequest, notFound } from '../../../utils/apiResponse.js';
import { getCompanyNameById } from '../../../middleware/services/company.service.js';

export async function getDesigns(req, res) {
  try {
    const { companyID } = req.auth;
    const designs = await DesignService.list(companyID);
    // normalize upload paths to absolute URLs for client convenience
    const hostBase = `${req.protocol}://${req.get('host')}`;
    const normalizePath = (p) => {
      if (!p) return p;
      // fix older records that used /designs/ folder
      const fixed = p.replace('/designs/', '/products/');
      return fixed && fixed.startsWith('/') ? `${hostBase}${fixed}` : fixed;
    };

    const normalized = (Array.isArray(designs) ? designs : []).map(d => ({
      ...d,
      image_urls: Array.isArray(d.image_urls) ? d.image_urls.map(u => normalizePath(u)) : d.image_urls,
      image_url: normalizePath(d.image_url),
      id: d.design_id || d.designId || d.id || d._id || null,
      name: d.design_name || d.designName || d.name || null
    }));
    return ok(res, normalized);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function getDesign(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const design = await DesignService.get(companyID, id);
    if (!design) return notFound(res, 'Design not found');
    const hostBase = `${req.protocol}://${req.get('host')}`;
    const normalizePath = (p) => {
      if (!p) return p;
      const fixed = p.replace('/designs/', '/products/');
      return fixed && fixed.startsWith('/') ? `${hostBase}${fixed}` : fixed;
    };

    const normalized = {
      ...design,
      image_urls: Array.isArray(design.image_urls) ? design.image_urls.map(u => normalizePath(u)) : design.image_urls,
      image_url: normalizePath(design.image_url),
      id: design.design_id || design.designId || design.id || design._id || null,
      name: design.design_name || design.designName || design.name || null
    };
    return ok(res, normalized);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function createDesign(req, res) {
  try {
    const { companyID } = req.auth;
    let data = { ...req.body };

    const companyName = await getCompanyNameById(companyID) || 'default';
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const urls = req.files.map(f => `/uploads/${safeName}/products/${f.filename}`);
      data.image_urls = urls;
      data.image_url = urls[0];
    } else if (req.file) {
      data.image_url = `/uploads/${safeName}/products/${req.file.filename}`;
    }

    const createdDesign = await DesignService.create(companyID, data);
    return created(res, createdDesign);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function updateDesign(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    let data = { ...req.body };

    const companyName = await getCompanyNameById(companyID) || 'default';
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const urls = req.files.map(f => `/uploads/${safeName}/products/${f.filename}`);
      data.image_urls = urls;
      data.image_url = urls[0];
    } else if (req.file) {
      data.image_url = `/uploads/${safeName}/products/${req.file.filename}`;
    }

    const updated = await DesignService.update(companyID, id, data);
    return ok(res, updated);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function deleteDesign(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    await DesignService.delete(companyID, id);
    return ok(res, { message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function updateDesignStatus(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const { status, note } = req.body;

    const reviewer_id = req.auth.userID || req.auth.userId || null;
    const reviewer_name = req.auth.name || req.auth.username || null;

    const noteObj = {
      reviewer_id,
      reviewer_name,
      note: note || null,
      created_at: new Date().toISOString()
    };

    const updated = await DesignService.updateStatus(companyID, id, status, noteObj);
    return ok(res, updated);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export default {
  getDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  updateDesignStatus
};
