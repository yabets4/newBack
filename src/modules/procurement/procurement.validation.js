import Joi from 'joi';

const statusEnum = Joi.string().valid('draft','sent','approved','partially_received','received','cancelled');

export const createPOSchema = Joi.object({
  body: Joi.object({
    supplier_name: Joi.string().max(160).required(),
    po_number: Joi.string().max(64).required(),
    status: statusEnum.default('draft'),
    total_amount: Joi.number().min(0).required(),
    ordered_at: Joi.date().required(),
    expected_at: Joi.date().min(Joi.ref('ordered_at')).optional(),
    notes: Joi.string().allow('', null),
  }).required()
});

export const updatePOSchema = Joi.object({
  body: Joi.object({
    supplier_name: Joi.string().max(160),
    po_number: Joi.string().max(64),
    status: statusEnum,
    total_amount: Joi.number().min(0),
    ordered_at: Joi.date(),
    expected_at: Joi.date(),
    notes: Joi.string().allow('', null),
  }).min(1).required()
});
