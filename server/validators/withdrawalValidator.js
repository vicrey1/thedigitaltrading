// validators/withdrawalValidator.js
const Joi = require('joi');

exports.validateBulkUpdate = (data) => {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).max(100).required(),
    action: Joi.string().valid('approved', 'rejected').required(),
    adminNotes: Joi.string().max(500).allow('')
  });

  return schema.validate(data);
};