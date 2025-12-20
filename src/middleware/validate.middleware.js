import Joi from 'joi';
import { badRequest } from '../utils/apiResponse.js';

export default function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      { body: req.body, params: req.params, query: req.query },
      { abortEarly: false, stripUnknown: true }
    );
    if (error) return badRequest(res, error.details.map(d => d.message).join(', '));
    Object.assign(req, value); // attach sanitized values back if needed
    next();
  };
}
