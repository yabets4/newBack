import { Router } from "express";
import { getAllLeads, getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  addQuoteAttachment,
  deleteQuoteAttachment,
  addQuoteItem,
  addQuoteItemAttachment,
  deleteQuoteItemAttachment, } from "./quote.controller.js";
import { uploadProjectFiles } from "../../../middleware/multer.middleware.js";


const r = Router();

r.get("/leads/", getAllLeads);
r.get("/", getQuotes);                  // GET all quotes
r.get("/:quoteId", getQuote);           // GET single quote

// Use `.any()` so multipart requests with multiple field names (attachments, item_files, etc.) are accepted
r.post("/", uploadProjectFiles.any(), createQuote);               // CREATE quote (supports multipart attachments)
r.put("/:quoteId", uploadProjectFiles.any(), updateQuote);        // UPDATE quote (supports multipart attachments)
r.delete("/:quoteId", deleteQuote);     // DELETE quote

// Quote attachments
r.post("/:quoteId/attachments", uploadProjectFiles.any(), addQuoteAttachment);               // add attachment (multipart)
r.delete("/:quoteId/attachments/:attachmentId", deleteQuoteAttachment); // remove attachment

// Quote items
r.post("/:quoteId/items", addQuoteItem);                           // add item to quote

// Quote item attachments
r.post("/items/:quoteItemId/attachments", uploadProjectFiles.any(), addQuoteItemAttachment);           // add attachment to an item (multipart)
r.delete("/items/attachments/:attachmentId", deleteQuoteItemAttachment);     // remove attachment from an item


export default r;
