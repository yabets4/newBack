import Joi from 'joi';

const typeEnum = Joi.string().valid('sales','inventory','finance','hr','custom');
const statusEnum = Joi.string().valid('pending','generating','ready','failed');

export const createReportSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(160).required(),
    type: typeEnum.required(),
    params: Joi.object().default({}),
    generated_at: Joi.date().optional(),
    status: statusEnum.default('pending'),
  }).required()
});

export const updateReportSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(160),
    type: typeEnum,
    params: Joi.object(),
    generated_at: Joi.date(),
    status: statusEnum,
  }).min(1).required()
});
