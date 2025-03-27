import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  RIAK_NODES: Joi.string().default('localhost:8087'),
  RIAK_BUCKET_TYPE: Joi.string().default('default'),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  CHUNK_SIZE: Joi.number().default(5 * 1024 * 1024),
  ENABLE_COMPRESSION: Joi.boolean().default(true),
  ENABLE_DEDUPLICATION: Joi.boolean().default(true),
  STORAGE_REGIONS: Joi.string().default('default'),
  DEFAULT_REGION: Joi.string().default('default'),

  SIGNED_URL_EXPIRATION: Joi.number().default(3600),

  CORS_ORIGIN: Joi.string().default('*'),
  CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'verbose', 'debug')
    .default('info'),
  LOG_DIRECTORY: Joi.string().default('logs'),
});
