<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

# VaultX

A scalable, secure, and highly available object storage solution designed to store, manage, and retrieve large volumes of unstructured data efficiently. This system supports multi-region replication, chunk-based storage, secure access controls, data compression, and deduplication, making it a competitive alternative to cloud-based solutions like AWS S3.

## Features

- **Multi-Region Support with Replication**
  - Data replication across multiple regions for high availability
  - Configurable replication policies
  - Support for both eventual and strong consistency models
  - Automatic failover and disaster recovery

- **Chunk-Based Storage for Large Files**
  - Large files are divided into smaller, fixed-size chunks
  - Distributed storage across multiple nodes
  - Parallel uploads and downloads for improved performance
  - Automatic reassembly upon retrieval

- **Secure Access via Signed URLs**
  - Temporary signed URLs for controlled access
  - Fine-grained permission settings
  - Integration with authentication and authorization
  - Access logging and monitoring

- **Data Compression and Deduplication**
  - Automatic compression to reduce storage costs
  - Content-aware deduplication to avoid redundant storage
  - Hash-based indexing for efficient duplicate detection
  - Background processing to optimize storage

- **Advanced Features**
  - File versioning and version control
  - File tagging and metadata management
  - Archiving and lifecycle management
  - Comprehensive audit logging
  - Quota management

## Technology Stack

- **NestJS**: Modern, progressive Node.js framework
- **Riak KV**: Distributed NoSQL database for reliable storage
- **BullMQ**: Redis-based queue for background job processing
- **Docker & Docker Compose**: Containerization and orchestration

## Requirements

- Node.js (v18 or higher)
- Docker and Docker Compose
- Redis (for BullMQ)
- Riak KV

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/distributed-file-storage.git
cd distributed-file-storage
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp .env.example .env
```

4. Start the application using Docker Compose:
```bash
docker-compose up -d
```

## Architecture Overview

The system consists of several key components:

- **API Layer**: RESTful APIs for client integration
- **Storage Nodes**: Distributed file storage nodes
- **Metadata Service**: Tracks object locations and access controls
- **Replication Engine**: Ensures multi-region data synchronization
- **Security Module**: Manages signed URLs, encryption, and access control
- **Monitoring & Logging**: Tracks system performance and user activity

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token

### Files

- `POST /api/files` - Create a new file entry
- `GET /api/files` - List all files for current user
- `GET /api/files/:id` - Get file details
- `PATCH /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete a file
- `POST /api/files/:id/chunks/:index` - Upload a file chunk
- `POST /api/files/:id/signed-url` - Generate a signed URL
- `GET /api/files/download/:signedUrl` - Download a file using signed URL
- `POST /api/files/:id/versions` - Create a new version
- `GET /api/files/:id/versions` - Get version history
- `POST /api/files/:id/archive` - Archive a file
- `POST /api/files/:id/restore-archive` - Restore an archived file
- `POST /api/files/:id/tags` - Add tags to a file
- `DELETE /api/files/:id/tags/:tag` - Remove a tag
- `POST /api/files/:id/metadata` - Update custom metadata
- `GET /api/files/stats/usage` - Get storage usage statistics
- `GET /api/files/search` - Advanced file search

### Storage Management

- `POST /api/storage/regions` - Create a storage region
- `GET /api/storage/regions` - List all regions
- `GET /api/storage/regions/:id` - Get region details
- `PATCH /api/storage/regions/:id/deactivate` - Deactivate a region
- `POST /api/storage/nodes` - Add a storage node
- `GET /api/storage/nodes` - List all storage nodes
- `GET /api/storage/regions/:regionId/nodes` - List nodes in a region

### Replication

- `POST /api/replication/files/:fileId/policy` - Create replication policy
- `GET /api/replication/files/:fileId/status` - Get replication status

## Usage Examples

### Creating a File

1. Create a file entry:
```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "important-document",
    "originalName": "important-document.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "compressionEnabled": true,
    "deduplicationEnabled": true
  }'
```

2. Upload file chunks:
```bash
curl -X POST http://localhost:3000/api/files/FILE_ID/chunks/0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "chunk=@/path/to/chunk0.bin"
```

3. Generate a signed URL for download:
```bash
curl -X POST http://localhost:3000/api/files/FILE_ID/signed-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expirationSeconds": 3600
  }'
```

### Creating a Replication Policy

```bash
curl -X POST http://localhost:3000/api/replication/files/FILE_ID/policy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetRegions": ["us-west-1", "eu-central-1"]
  }'
```

## Advanced Configuration

### Scaling Options

The system can be scaled horizontally by adding more instances of:

- API servers behind a load balancer
- Worker nodes for processing jobs
- Riak nodes for increased storage capacity
- Redis instances for distributed caching

### Performance Tuning

Key configuration parameters in `.env`:

```
# Chunk size for file splitting (in bytes)
CHUNK_SIZE=5242880

# Redis configuration for caching
REDIS_CACHE_TTL=300

# BullMQ concurrency
BULL_CONCURRENCY=5

# Circuit breaker settings
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

## Monitoring and Maintenance

### Health Checks

The system provides health check endpoints:

- `/health` - Overall system health
- `/health/liveness` - Server availability
- `/health/readiness` - System readiness
- `/health/metrics` - Performance metrics

### Backup and Recovery

For data safety, implement regular backups:

1. Backup Riak data using snapshots
2. Export metadata periodically
3. Set up a disaster recovery plan with multi-region replication

## Security Considerations

- All API endpoints are secured with JWT authentication
- File access is controlled through signed URLs with expiration
- Sensitive operations use idempotency keys for safe retries
- Circuit breakers prevent cascade failures
- Rate limiting protects against abuse

## Development

### Running in Development Mode

```bash
npm run start:dev
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Structure

# Distributed File Storage System (continued)

### Code Structure (continued)

```
distributed-file-storage/
├── src/
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Main module
│   ├── config/                   # Configuration
│   ├── common/                   # Shared utilities and constants
│   │   ├── constants/            # System constants
│   │   ├── decorators/           # Custom decorators
│   │   ├── filters/              # Exception filters
│   │   ├── guards/               # Authentication guards
│   │   ├── interceptors/         # Request/response interceptors
│   │   └── utils/                # Utility functions
│   ├── auth/                     # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/           # Authentication strategies
│   │   ├── dto/                  # Data transfer objects
│   │   └── interfaces/           # TypeScript interfaces
│   ├── users/                    # User management
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── entities/             # User entities
│   │   ├── dto/                  # Data transfer objects
│   │   └── interfaces/           # TypeScript interfaces
│   ├── files/                    # File management
│   │   ├── files.module.ts
│   │   ├── files.service.ts
│   │   ├── files.controller.ts
│   │   ├── entities/             # File entities
│   │   ├── dto/                  # Data transfer objects
│   │   ├── interfaces/           # TypeScript interfaces
│   │   └── repositories/         # Data access layer
│   ├── storage/                  # Storage management
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts
│   │   ├── storage.controller.ts
│   │   ├── entities/             # Storage entities
│   │   ├── dto/                  # Data transfer objects
│   │   └── interfaces/           # TypeScript interfaces
│   ├── replication/              # Replication management
│   │   ├── replication.module.ts
│   │   ├── replication.service.ts
│   │   ├── replication.controller.ts
│   │   ├── dto/                  # Data transfer objects
│   │   └── interfaces/           # TypeScript interfaces
│   ├── compression/              # Data compression
│   │   ├── compression.module.ts
│   │   ├── compression.service.ts
│   │   ├── interfaces/           # TypeScript interfaces
│   │   └── processors/           # Compression job processors
│   ├── deduplication/            # Data deduplication
│   │   ├── deduplication.module.ts
│   │   ├── deduplication.service.ts
│   │   ├── interfaces/           # TypeScript interfaces
│   │   └── processors/           # Deduplication job processors
│   └── jobs/                     # Background job processing
│       ├── jobs.module.ts
│       ├── queues/               # Queue definitions
│       └── processors/           # Job processors
└── test/                         # Tests
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

## Technical Implementation Details

### Chunk-Based Storage

Files are divided into smaller chunks (default: 5MB) for more efficient storage and transfer:

- Each chunk is uniquely identified and can be stored on different nodes
- Chunks are stored with their hash for integrity verification
- Parallel upload/download of chunks improves performance
- Reassembly happens automatically when downloading

### Multi-Region Replication

Data can be replicated across multiple geographic regions:

- Each region contains multiple storage nodes
- Replication policies define which regions store which files
- Background jobs handle the replication process
- Consistency models (eventual or strong) can be configured

### Deduplication System

The system avoids storing duplicate data:

- Content-based deduplication using SHA-256 hashes
- Works at both file and chunk levels
- Reference counting tracks how many files use each chunk
- Significant storage savings for similar files

### Secure Access Control

File access is secured through temporary signed URLs:

- URLs contain cryptographic signatures that verify authenticity
- Expiration times limit how long a URL remains valid
- User IDs embedded in URLs ensure only authorized users can access
- All access attempts are logged for security auditing

### Background Processing

Resource-intensive tasks run asynchronously using BullMQ:

- Upload processing calculates hashes and prepares files
- Replication jobs copy data between regions
- Compression jobs reduce file sizes
- Deduplication jobs identify and eliminate duplicates

### Error Handling and Resilience

The system is designed to handle failures gracefully:

- Circuit breakers prevent cascade failures
- Idempotent operations allow safe retries
- Distributed locking prevents race conditions
- Graceful shutdown ensures data integrity during restarts

## Performance Considerations

### Optimizing for Large Files

The chunk-based approach offers several advantages for large files:

- Memory usage remains constant regardless of file size
- Failed transfers can resume from the last successful chunk
- Parallel processing improves throughput
- Deduplication is more effective at the chunk level

### Caching Strategy

The system implements a multi-level caching strategy:

- In-memory cache for frequently accessed metadata
- Redis cache for file chunks of popular files
- Configurable TTL (Time-To-Live) for different cache levels

### Database Tuning

Riak KV configuration for optimal performance:

- Proper node sizing based on expected storage volume
- Consistent hashing for better data distribution
- Tuned read/write parameters for your specific workload

## Deployment Options

### Docker Deployment

The included Docker Compose file provides a quick way to start all required services:

```bash
docker-compose up -d
```

### Kubernetes Deployment

For production environments, Kubernetes is recommended:

1. Build container images:
```bash
docker build -t distributed-file-storage:latest .
```

2. Apply Kubernetes manifests (example):
```bash
kubectl apply -f k8s/
```

### Cloud Provider Deployment

The system can be deployed on major cloud providers:

- **AWS**: Use ECS/EKS for containers, ElastiCache for Redis
- **Azure**: Use AKS for containers, Azure Cache for Redis
- **GCP**: Use GKE for containers, Memorystore for Redis

## Troubleshooting

### Common Issues

1. **Upload failures**: Check chunk size configuration and client timeout settings
2. **Slow downloads**: Verify region selection and network connectivity
3. **High memory usage**: Adjust worker concurrency and chunk processing settings
4. **Database connection issues**: Check Riak cluster health and network configuration

### Logging

The system uses structured logging for easier troubleshooting:

- Log levels can be configured in the `.env` file
- Logs include request IDs for tracing requests across services
- Error logs contain stack traces for debugging

### Monitoring

Key metrics to monitor:

- Upload/download throughput
- Storage utilization per region and node
- Job queue lengths
- Error rates by endpoint and operation type
- Cache hit/miss ratios

## Roadmap

Future planned features:

- **Client-Side Encryption**: Add end-to-end encryption
- **Advanced Search**: Full-text search capabilities
- **Event Webhooks**: Notify external systems of file events
- **Multi-Cluster Support**: Expand beyond regions to multiple data centers
- **AI-Powered Storage Optimization**: Intelligent tiering based on access patterns

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NestJS team for the excellent framework
- Basho for Riak KV
- Bull team for the reliable queue implementation
- All contributors who have helped shape this project

---

For more information, please contact