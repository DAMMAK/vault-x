export const QUEUES = {
  UPLOAD: 'upload-queue',
  REPLICATION: 'replication-queue',
  COMPRESSION: 'compression-queue',
  DEDUPLICATION: 'deduplication-queue',
};

export const RIAK_BUCKETS = {
  USERS: 'users',
  FILES: 'files',
  CHUNKS: 'chunks',
  REGIONS: 'regions',
  STORAGE_NODES: 'storage-nodes',
};

export const FILE_STATUS = {
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  AVAILABLE: 'available',
  FAILED: 'failed',
  DELETED: 'deleted',
};

export const REPLICATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const CONSISTENCY_MODELS = {
  EVENTUAL: 'eventual',
  STRONG: 'strong',
};
