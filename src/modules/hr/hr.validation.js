import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  body: Joi.object({
    first_name: Joi.string().max(80).required(),
    last_name: Joi.string().max(80).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(32).allow('', null),
    position: Joi.string().max(120).required(),
    hire_date: Joi.date().required(),
    salary: Joi.number().min(0).required(),
  }).required()
});

export const updateEmployeeSchema = Joi.object({
  body: Joi.object({
    first_name: Joi.string().max(80),
    last_name: Joi.string().max(80),
    email: Joi.string().email(),
    phone: Joi.string().max(32).allow('', null),
    position: Joi.string().max(120),
    hire_date: Joi.date(),
    salary: Joi.number().min(0),
  }).min(1).required()
});
