// validators/exportValidator.js
const Joi = require('joi');

exports.validateExportRequest = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('all', 'pending', 'completed', 'rejected').default('all'),
    currency: Joi.string().valid('all', 'USDT', 'BTC', 'ETH', 'BNB').default('all'),
    dateRange: Joi.number().valid(1, 7, 30, 90, 365).default(7),
    amountMin: Joi.number().min(0),
    amountMax: Joi.number().min(0),
    userTier: Joi.string().valid('all', 'basic', 'silver', 'gold', 'vip').default('all')
  });

  return schema.validate(data);
};