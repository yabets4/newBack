import { Router } from "express";
import {
  getAllLeads, getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  addQuoteAttachment,
  deleteQuoteAttachment,
  addQuoteItem,
  addQuoteItemAttachment,
  deleteQuoteItemAttachment,
} from "./quote.controller.js";
import { uploadProjectFiles } from "../../../middleware/multer.middleware.js";
import permission from "../../../middleware/permission.middleware.js";


const r = Router();

const canRead = permission(['quotes.read.all', 'quotes.read.own_only']);
const canCreate = permission('quotes.create');
const canUpdate = permission(['quotes.update.all', 'quotes.update.own_only']);
const canDelete = permission(['quotes.delete.all', 'quotes.delete.own_only']);

r.get("/leads/", canRead, getAllLeads);
r.get("/", canRead, getQuotes);                  // GET all quotes
r.get("/:quoteId", canRead, getQuote);           // GET single quote

// Use `.any()` so multipart requests with multiple field names (attachments, item_files, etc.) are accepted
r.post("/", canCreate, uploadProjectFiles.any(), createQuote);               // CREATE quote (supports multipart attachments)
r.put("/:quoteId", canUpdate, uploadProjectFiles.any(), updateQuote);        // UPDATE quote (supports multipart attachments)
r.delete("/:quoteId", canDelete, deleteQuote);     // DELETE quote

// Quote attachments (Update)
r.post("/:quoteId/attachments", canUpdate, uploadProjectFiles.any(), addQuoteAttachment);               // add attachment (multipart)
r.delete("/:quoteId/attachments/:attachmentId", canUpdate, deleteQuoteAttachment); // remove attachment

// Quote items (Update)
r.post("/:quoteId/items", canUpdate, addQuoteItem);                           // add item to quote

// Quote item attachments (Update)
r.post("/items/:quoteItemId/attachments", canUpdate, uploadProjectFiles.any(), addQuoteItemAttachment);           // add attachment to an item (multipart)
r.delete("/items/attachments/:attachmentId", canUpdate, deleteQuoteItemAttachment);     // remove attachment from an item


export default r;
