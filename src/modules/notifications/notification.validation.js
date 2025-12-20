import Joi from 'joi';

const channelEnum = Joi.string().valid('email','sms','push','inapp');
const statusEnum = Joi.string().valid('pending','queued','sent','failed');

export const createNotificationSchema = Joi.object({
  body: Joi.object({
    channel: channelEnum.required(),
    recipient: Joi.string().max(160).required(),
    subject: Joi.string().max(160).allow('', null),
    body: Joi.string().required(),
    status: statusEnum.default('pending'),
    scheduled_at: Joi.date().optional(),
    metadata: Joi.object().default({}),
  }).required()
});

export const updateNotificationSchema = Joi.object({
  body: Joi.object({
    channel: channelEnum,
    recipient: Joi.string().max(160),
    subject: Joi.string().max(160).allow('', null),
    body: Joi.string(),
    status: statusEnum,
    scheduled_at: Joi.date(),
    metadata: Joi.object(),
  }).min(1).required()
});
