import QuoteService from './quote.service.js';
import { ok, badRequest, notFound } from '../../../utils/apiResponse.js';
import { getCompanyNameById } from '../../../middleware/services/company.service.js';

export async function getAllLeads(req, res) {
  try {
    const { companyID } = req.auth;
    if (!companyID) return res.status(400).json({ error: 'Company ID is required' });

    const leads = await QuoteService.getAllLeads(companyID);
    return res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// GET all quotes
export async function getQuotes(req, res) {
  try {
    const { companyID } = req.auth;
    const quotes = await QuoteService.list(companyID);
    console.log(quotes);

    return ok(res, quotes);
  } catch (error) {
    console.log(error);
    return badRequest(res, error.message);
  }
}

// GET single quote
export async function getQuote(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId } = req.params;
    const quote = await QuoteService.get(companyID, quoteId);
    console.log(quote);
    if (!quote) return notFound(res, "Quote not found");
    return ok(res, quote);
  } catch (error) {
    console.log(error);
    return badRequest(res, error.message);
  }
}

// POST create quote
export async function createQuote(req, res) {
  try {
    const { companyID } = req.auth;
    // If multipart FormData sent `items` as a JSON string, parse it into an array
    if (req.body.items && typeof req.body.items === 'string') {
      try {
        req.body.items = JSON.parse(req.body.items);
      } catch (e) {
        // leave as-is; service/model will validate
        console.warn('Failed to parse req.body.items JSON:', e && e.message ? e.message : e);
      }
    }

    // Handle multipart uploads: map uploaded files to attachments
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    // DEBUG: print incoming files and items to help trace missing item attachments
    console.log('createQuote - incoming req.files:', (req.files || []).map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));
    console.log('createQuote - incoming req.body.items (preview):', Array.isArray(req.body.items) ? req.body.items.map((it, i) => ({ idx: i, attachments: (it.attachments || []).length })) : req.body.items);

    // Fetch company name to match Multer's folder structure
    const companyName = await getCompanyNameById(companyID) || 'default';
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Only consider files uploaded under the `attachments` field for quote-level attachments
    const quoteFiles = (req.files || []).filter(f => f.fieldname === 'attachments');
    const attachments = quoteFiles.map((f, idx) => ({
      file_url: `/uploads/${safeName}/projects/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    // If there are uploaded attachments, attach them into the request body for the service
    if (attachments.length) req.body.attachments = attachments;

    // If item files were uploaded, map them into the parsed items (req.body.items may be a string already parsed earlier)
    try {
      // 1) Support explicit fieldname pattern uploads from the UI inputs like
      //    `description-attachment-<index>` and `3d-attachment-<index>`.
      //    These inputs may be submitted by FormData if the frontend doesn't normalize names.
      req.body.items = req.body.items || [];
      const files = req.files || [];

      for (const f of files) {
        const descMatch = /^description-attachment-(\d+)$/.exec(f.fieldname);
        const threeDMatch = /^3d-attachment-(\d+)$/.exec(f.fieldname);
        if (descMatch || threeDMatch) {
          const idx = Number((descMatch || threeDMatch)[1]);
          const att = {
            file_url: `/uploads/${safeName}/projects/${f.filename}`,
            file_type: f.mimetype,
            description: req.body[`description-attachment-desc-${idx}`] || f.originalname || ''
          };
          req.body.items[idx] = req.body.items[idx] || {};
          req.body.items[idx].attachments = req.body.items[idx].attachments || [];
          req.body.items[idx].attachments.push(att);
        }
      }

      // 2) Backwards-compatible: support `item_files` + `item_files_meta[]` mapping
      let itemFilesMeta = req.body.item_files_meta || req.body['item_files_meta[]'] || [];
      if (typeof itemFilesMeta === 'string') itemFilesMeta = [itemFilesMeta];
      itemFilesMeta = itemFilesMeta.map(m => (typeof m === 'string' ? JSON.parse(m) : m));

      if (Array.isArray(itemFilesMeta) && files.length) {
        const itemFiles = files.filter(f => f.fieldname === 'item_files');
        const filesByOriginal = {};
        for (const f of itemFiles) {
          if (!filesByOriginal[f.originalname]) filesByOriginal[f.originalname] = [];
          filesByOriginal[f.originalname].push(f);
        }

        for (const meta of itemFilesMeta) {
          const matches = filesByOriginal[meta.originalName] || [];
          const fileObj = matches.shift();
          if (!fileObj) continue;
          const att = {
            file_url: `/uploads/${safeName}/projects/${fileObj.filename}`,
            file_type: fileObj.mimetype,
            description: meta.description || ''
          };
          const idx = Number(meta.itemIndex) || 0;
          req.body.items[idx] = req.body.items[idx] || {};
          req.body.items[idx].attachments = req.body.items[idx].attachments || [];
          req.body.items[idx].attachments.push(att);
        }
      }
    } catch (e) {
      console.warn('Failed to map item files into items:', e && e.message ? e.message : e);
    }
    // Clean up transient multipart/form keys so they don't get passed to the model
    delete req.body.attachment_descriptions;
    delete req.body['attachment_descriptions[]'];
    delete req.body.item_files_meta;
    delete req.body['item_files_meta[]'];
    delete req.body.item_files;
    delete req.body.existing_attachments;
    // remove any per-item description fields (e.g. description-attachment-desc-<idx>, 3d-attachment-desc-<idx>)
    Object.keys(req.body).forEach(k => {
      if (/^(description-attachment-desc-|3d-attachment-desc-)/.test(k)) delete req.body[k];
    });

    const newQuote = await QuoteService.create(companyID, req.body);
    return ok(res, newQuote);
  } catch (error) {
    console.log(error);
    return badRequest(res, error.message);
  }
}

// PUT update quote
export async function updateQuote(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId } = req.params;
    // If multipart FormData sent `items` as a JSON string, parse it into an array
    if (req.body.items && typeof req.body.items === 'string') {
      try {
        req.body.items = JSON.parse(req.body.items);
      } catch (e) {
        console.warn('Failed to parse req.body.items JSON:', e && e.message ? e.message : e);
      }
    }

    // DEBUG: print incoming files and items to help trace missing item attachments
    console.log('updateQuote - incoming req.files:', (req.files || []).map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));
    console.log('updateQuote - incoming req.body.items (preview):', Array.isArray(req.body.items) ? req.body.items.map((it, i) => ({ idx: i, attachments: (it.attachments || []).length })) : req.body.items);

    // Parse existing attachments if provided (stringified JSON fields may come from FormData)
    let existingAttachments = [];
    if (req.body.existing_attachments) {
      const raw = Array.isArray(req.body.existing_attachments)
        ? req.body.existing_attachments
        : [req.body.existing_attachments];
      existingAttachments = raw.map((att) => typeof att === 'string' ? JSON.parse(att) : att);
      // leave existing_attachments in body if needed by service
    }

    // New uploaded files
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    // Only create quote-level attachments from files uploaded under `attachments`
    const quoteFilesForUpdate = (req.files || []).filter(f => f.fieldname === 'attachments');
    const newAttachments = quoteFilesForUpdate.map((f, idx) => ({
      file_url: `/uploads/${safeName}/leads/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    // Map item_files into items attachments if provided (item_files_meta[] present)
    try {
      let itemFilesMeta = req.body.item_files_meta || req.body['item_files_meta[]'] || [];
      if (typeof itemFilesMeta === 'string') itemFilesMeta = [itemFilesMeta];
      itemFilesMeta = itemFilesMeta.map(m => (typeof m === 'string' ? JSON.parse(m) : m));

      if (Array.isArray(itemFilesMeta) && (req.files || []).length) {
        // Only use files uploaded under `item_files` field
        const itemFiles = (req.files || []).filter(f => f.fieldname === 'item_files');
        const filesByOriginal = {};
        for (const f of itemFiles) {
          if (!filesByOriginal[f.originalname]) filesByOriginal[f.originalname] = [];
          filesByOriginal[f.originalname].push(f);
        }

        req.body.items = req.body.items || [];
        for (const meta of itemFilesMeta) {
          const matches = filesByOriginal[meta.originalName] || [];
          const fileObj = matches.shift();
          if (!fileObj) continue;
          const att = {
            file_url: `/uploads/${safeName}/projects/${fileObj.filename}`,
            file_type: fileObj.mimetype,
            description: meta.description || ''
          };
          const idx = Number(meta.itemIndex) || 0;
          req.body.items[idx] = req.body.items[idx] || {};
          req.body.items[idx].attachments = req.body.items[idx].attachments || [];
          req.body.items[idx].attachments.push(att);
        }
      }
    } catch (e) {
      console.warn('Failed to map item files into items on update:', e && e.message ? e.message : e);
    }

    // Combine existing attachments (from form) and new uploaded attachments into the single
    // `attachments` array expected by QuoteModel.update so it will replace attachments correctly.
    let combinedAttachments = [];
    if (existingAttachments && existingAttachments.length) combinedAttachments = combinedAttachments.concat(existingAttachments);
    if (newAttachments && newAttachments.length) combinedAttachments = combinedAttachments.concat(newAttachments);
    if (combinedAttachments.length) {
      req.body.attachments = combinedAttachments;
    }

    // Remove transient multipart/form fields so the model doesn't try to update non-existent columns
    delete req.body.attachment_descriptions;
    delete req.body['attachment_descriptions[]'];
    delete req.body.item_files_meta;
    delete req.body['item_files_meta[]'];
    delete req.body.item_files;
    delete req.body.existing_attachments;
    Object.keys(req.body).forEach(k => {
      if (/^(description-attachment-desc-|3d-attachment-desc-)/.test(k)) delete req.body[k];
    });

    const updated = await QuoteService.update(companyID, quoteId, req.body);
    return ok(res, updated);
  } catch (error) {
    console.log(error);

    return badRequest(res, error.message);
  }
}

// DELETE quote
export async function deleteQuote(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId } = req.params;
    await QuoteService.remove(companyID, quoteId);
    return ok(res, "Quote deleted");
  } catch (error) {
    return badRequest(res, error.message);
  }
}

// POST add attachment
export async function addQuoteAttachment(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId } = req.params;
    // Build attachments from uploaded files (and optional descriptions)
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    const quoteFiles = (req.files || []).filter(f => f.fieldname === 'attachments');
    const attachments = quoteFiles.map((f, idx) => ({
      file_url: `/uploads/${safeName}/projects/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    // if attachments were sent in body (non-multipart), keep them; otherwise set from files
    if (attachments.length) req.body.attachments = attachments;

    const attachment = await QuoteService.addAttachment(companyID, quoteId, req.body);
    return ok(res, attachment);
  } catch (error) {
    return badRequest(res, error.message);
  }
}

// DELETE attachment
export async function deleteQuoteAttachment(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId, attachmentId } = req.params;
    await QuoteService.removeAttachment(companyID, quoteId, attachmentId);
    return ok(res, "Attachment removed");
  } catch (error) {
    return badRequest(res, error.message);
  }
}

// POST add item
export async function addQuoteItem(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteId } = req.params;
    const item = await QuoteService.addItem(companyID, quoteId, req.body);
    return ok(res, item);
  } catch (error) {
    return badRequest(res, error.message);
  }
}

// POST add item attachment
export async function addQuoteItemAttachment(req, res) {
  try {
    const { companyID } = req.auth;
    const { quoteItemId } = req.params;
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    const itemFiles = (req.files || []).filter(f => f.fieldname === 'attachments' || f.fieldname === 'item_files');
    const attachments = itemFiles.map((f, idx) => ({
      file_url: `/uploads/${safeName}/projects/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    if (attachments.length) req.body.attachments = attachments;

    const attachment = await QuoteService.addItemAttachment(companyID, quoteItemId, req.body);
    return ok(res, attachment);
  } catch (error) {
    return badRequest(res, error.message);
  }
}

// DELETE item attachment
export async function deleteQuoteItemAttachment(req, res) {
  try {
    const { companyID } = req.auth;
    const { attachmentId } = req.params;
    await QuoteService.removeItemAttachment(companyID, attachmentId);
    return ok(res, "Item attachment removed");
  } catch (error) {
    return badRequest(res, error.message);
  }
}



