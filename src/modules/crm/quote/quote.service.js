import {QuoteModel} from './quote.model.js';

const QuoteService = {
  async getAllLeads(companyId) {
    if (!companyId) throw new Error('Company ID is required');

    // Fetch leads with profiles
    const leadsWithProfiles = await QuoteModel.getAllLeads(companyId);

    // Any additional processing can be done here if needed
    return leadsWithProfiles;
  },

  async list(companyId) {
    if (!companyId) throw new Error("companyId is required");
    return QuoteModel.findAll(companyId);
  },

  // get a single quote with all details
  async get(companyId, quoteId) {
    if (!companyId || !quoteId) throw new Error("companyId & quoteId are required");
    return QuoteModel.findById(companyId, quoteId);
  },

  // create a new quote
  async create(companyId, data) {
    if (!companyId) throw new Error("companyId is required");
    return QuoteModel.insert(companyId, data);
  },

  // update a quote
  async update(companyId, quoteId, data) {
    if (!companyId || !quoteId) throw new Error("companyId & quoteId are required");
    return QuoteModel.update(companyId, quoteId, data);
  },

  // delete a quote
  async remove(companyId, quoteId) {
    if (!companyId || !quoteId) throw new Error("companyId & quoteId are required");
    return QuoteModel.remove(companyId, quoteId);
  },

  // add quote attachment
  async addAttachment(companyId, quoteId, attachmentData) {
    return QuoteModel.addAttachment(companyId, quoteId, attachmentData);
  },

  // remove quote attachment
  async removeAttachment(companyId, quoteId, attachmentId) {
    return QuoteModel.removeAttachment(companyId, quoteId, attachmentId);
  },

  // add item to quote
  async addItem(companyId, quoteId, itemData) {
    return QuoteModel.addItem(companyId, quoteId, itemData);
  },

  // add attachment to a specific item in quote
  async addItemAttachment(companyId, quoteItemId, attachmentData) {
    return QuoteModel.addItemAttachment(companyId, quoteItemId, attachmentData);
  },

  // remove attachment from a specific item in quote
  async removeItemAttachment(companyId, quoteItemAttachmentId) {
    return QuoteModel.removeItemAttachment(companyId, quoteItemAttachmentId);
  },
};

export default QuoteService;