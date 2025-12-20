import Joi from 'joi';
export const createCRMSchema = Joi.object({ body: Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(32),
}).required() });
export const updateCRMSchema = Joi.object({ body: Joi.object({
  name: Joi.string(), email: Joi.string().email(), phone: Joi.string().max(32),
}).min(1).required() });
