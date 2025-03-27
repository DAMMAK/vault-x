export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  appName: process.env.APP_NAME || 'Distributed File Storage System',

  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME || '1d',
  },
  signedUrls: {
    expirationTime: parseInt(process.env.SIGNED_URL_EXPIRATION || '3600', 10), // 1 hour default
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  },
  riak: {
    nodes: process.env.RIAK_NODES?.split(',').map((node) => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port, 10) };
    }) || [{ host: 'riak', port: 8087 }],
    protocol: process.env.RIAK_PROTOCOL || 'http',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
  },

  storage: {
    chunkSize: process.env.CHUNK_SIZE || 5242880, // 5MB in bytes
    defaultRegion: process.env.DEFAULT_REGION || 'us-east-1',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || 'logs',
  },
});
