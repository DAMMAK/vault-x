<p align="center">
  <a href="http://nestjs.com/" target="_blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.
</p>

<p align="center">
  <!-- Add badges for npm version, license, downloads, CircleCI, Discord, Open Collective, PayPal, Twitter -->
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

# VaultX

VaultX is a scalable, secure, and highly available object storage solution designed for efficiently storing, managing, and retrieving large volumes of unstructured data. Featuring multi-region replication, chunk-based storage, advanced security controls (including temporary signed URLs), data compression, and deduplication, VaultX is a robust alternative to cloud-based storage solutions.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
  - [Managing Files](#managing-files)
  - [Replication Policies](#replication-policies)
- [Development](#development)
  - [Running in Development Mode](#running-in-development-mode)
  - [Running Tests](#running-tests)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Kubernetes & Cloud Providers](#kubernetes--cloud-providers)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Roadmap](#roadmap)
- [Acknowledgments](#acknowledgments)

---

## Key Features

- **Multi-Region Replication**
  - Replicate data across multiple geographic regions for high availability.
  - Configurable replication policies with support for eventual and strong consistency models.
  - Automatic failover and disaster recovery mechanisms.

- **Chunk-Based Storage**
  - Files are split into fixed-size chunks (default: 5MB) to improve upload and download performance.
  - Supports parallel transfers and automatic reassembly during retrieval.
  - Integrity is maintained via hash validation for each chunk.

- **Secure Access via Signed URLs**
  - Generate temporary, signed URLs to securely access files.
  - Configurable expiration and embedded permission data.
  - Detailed access logging for auditing purposes.

- **Data Compression & Deduplication**
  - Automatic compression to reduce storage costs.
  - Deduplication logic ensures that duplicate data is not redundantly stored.
  - Background processing jobs (powered by BullMQ and Redis) optimize file storage.

- **Advanced Features**
  - **File Versioning:** Maintain version history and enable rollbacks.
  - **Metadata & Tagging:** Advanced file tagging and custom metadata management.
  - **Audit Logging & Quota Management:** Comprehensive logging and resource management controls.

---

## Architecture Overview

VaultX is modular, comprising the following components:

- **API Layer:**  
  Provides RESTful endpoints for file management, authentication, and administration.

- **Storage Nodes:**  
  Distributed nodes that handle the chunk-based storage and rapid retrieval of files.

- **Metadata Service:**  
  Manages file-chunk associations, file versions, and custom metadata related to each file.

- **Replication Engine:**  
  Orchestrates cross-region data replication with configurable policies.

- **Security Module:**  
  Handles JWT authentication, signed URL generation, and advanced access control.

- **Background Processing Jobs:**  
  Uses BullMQ (with Redis) to perform resource-intensive tasks such as compression, deduplication, and replication as asynchronous background jobs.

- **Monitoring & Logging:**  
  Integrated Prometheus metrics and structured logging (using Winston) provide full observability and health checks.

---

## Technology Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL (managed via TypeORM)
- **Cache & Queues:** Redis (for BullMQ and caching)
- **Job Processing:** BullMQ for asynchronous background tasks
- **Containerization:** Docker & Docker Compose; Kubernetes for production deployments
- **Other Libraries:** Helmet for security, Joi for configuration validation, and Winston for logging.

---

## Getting Started

### Prerequisites

- **Node.js:** v18+  
- **Docker & Docker Compose:** For container orchestration  
- **Redis:** Required for background job queue processing  
- **PostgreSQL:** Used for metadata storage  

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/vault-x.git
   cd vault-x
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Environment Configuration:**

   Create a `.env` file at the project root (or use the provided `.env.example` as a starting point):

   ```bash
   cp .env.example .env
   ```

4. **Database & Messaging Setup:**

   Ensure PostgreSQL and Redis are running (or use Docker Compose to set them up).

### Configuration

VaultX’s configuration is managed through environment variables specified in the `.env` file. Example configuration:

```
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=vault_x

# JWT Settings
jwt.secret=your_jwt_secret
jwt.expirationTime=3600s

# Redis Settings
REDIS_HOST=redis
REDIS_PORT=6379

# File Storage
CHUNK_SIZE=5242880

# BullMQ
BULL_CONCURRENCY=5

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

---

## API Documentation

VaultX exposes a variety of REST endpoints. Key endpoints include:

### Authentication
- **POST** `/api/auth/register` – Register a new user.
- **POST** `/api/auth/login` – Authenticate and obtain an access token.

### Files Management
- **POST** `/api/files` – Create a new file entry.
- **GET** `/api/files` – List all files for the authenticated user.
- **GET** `/api/files/:id` – Retrieve details for a specific file.
- **PATCH** `/api/files/:id` – Update file metadata.
- **DELETE** `/api/files/:id` – Delete a file.
- **POST** `/api/files/:id/chunks/:index` – Upload file chunks.
- **POST** `/api/files/:id/signed-url` – Generate a temporary signed URL.
- **GET** `/api/files/download/:signedUrl` – Download a file using a signed URL.
- **POST** `/api/files/:id/versions` – Create a new file version.
- **GET** `/api/files/:id/versions` – Retrieve file version history.
- **POST** `/api/files/:id/archive` – Archive a file.
- **POST** `/api/files/:id/restore-archive` – Restore an archived file.
- **POST** `/api/files/:id/tags` – Add tags to a file.
- **DELETE** `/api/files/:id/tags/:tag` – Remove a tag.
- **POST** `/api/files/:id/metadata` – Update custom metadata.
- **GET** `/api/files/stats/usage` – Get storage usage statistics.
- **GET** `/api/files/search` – Advanced file search.

### Storage Management
- **POST** `/api/storage/regions` – Create a new storage region.
- **GET** `/api/storage/regions` – List all regions.
- **GET** `/api/storage/regions/:id` – Retrieve details for a region.
- **PATCH** `/api/storage/regions/:id/deactivate` – Deactivate a region.
- **POST** `/api/storage/nodes` – Add a new storage node.
- **GET** `/api/storage/nodes` – List all storage nodes.
- **GET** `/api/storage/regions/:regionId/nodes` – List nodes for a specific region.

### Replication
- **POST** `/api/replication/files/:fileId/policy` – Create a replication policy.
- **GET** `/api/replication/files/:fileId/status` – Check the replication status of a file.

### Health Checks & Metrics
- **GET** `/health` – Overall system health.
- **GET** `/health/liveness` – Liveness probe.
- **GET** `/health/readiness` – Readiness probe.
- **GET** `/health/metrics` – Performance and custom metrics.

---

## Usage Examples

### Managing Files

1. **Create a File Entry:**

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

2. **Upload File Chunks:**

   ```bash
   curl -X POST http://localhost:3000/api/files/FILE_ID/chunks/0 \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: multipart/form-data" \
     -F "chunk=@/path/to/chunk0.bin"
   ```

3. **Generate a Signed URL for Download:**

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

---

## Development

### Running in Development Mode

Launch the project in development mode with hot-reloading:

```bash
npm run start:dev
```

### Running Tests

VaultX comes with both unit and end-to-end tests:

- **Unit Tests:**

  ```bash
  npm run test
  ```

- **End-to-End Tests:**

  ```bash
  npm run test:e2e
  ```

- **Test Coverage:**

  ```bash
  npm run test:cov
  ```

---

### Code Structure

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

---

## Deployment

### Docker Deployment

VaultX can be quickly launched using Docker Compose. The repository includes a `docker-compose.yml` file to set up the API server, PostgreSQL, pgAdmin, and Redis.

1. **Build and Start Containers:**

   ```bash
   docker-compose up -d
   ```

2. **Accessing the Services:**
   - API Server: [http://localhost:3000](http://localhost:3000)
   - pgAdmin: [http://localhost:8080](http://localhost:8080)  
   - Redis: Running on port 6379

### Kubernetes & Cloud Providers

For production deployments using Kubernetes:

1. **Build the Docker Image:**

   ```bash
   docker build -t vault-x:latest .
   ```

2. **Deploy Kubernetes Manifests:**

   ```bash
   kubectl apply -f k8s/
   ```

VaultX can also be deployed on major cloud platforms:
- **AWS:** ECS/EKS, ElastiCache for Redis.
- **Azure:** AKS, Azure Cache for Redis.
- **GCP:** GKE, Memorystore for Redis.

---

## Monitoring & Maintenance

- **Health Checks:**  
  Utilize endpoints `/health`, `/health/liveness`, and `/health/readiness` for monitoring.

- **Metrics:**  
  Integrated Prometheus metrics provide insights into system performance.

- **Logging:**  
  Structured logging using Winston includes request IDs and stack traces for in-depth troubleshooting.

- **Backups:**  
  Regular PostgreSQL data exports and persistence of job queues ensure data integrity and easy recovery.

---

## Troubleshooting

- **File Upload/Download Issues:**  
  Verify that chunk size configurations match across the client and server in your `.env` file, and inspect network connectivity.

- **Performance Issues:**  
  Monitor BullMQ job queues and adjust worker concurrency or chunk sizes as necessary.

- **Database Connectivity:**  
  Confirm that your PostgreSQL instance is running correctly and that the database configuration variables are set appropriately.

- **Error Logging:**  
  Review structured logs for detailed error messages along with request IDs to trace issues.

---

## Contributing

Contributions are welcome! Follow these steps to contribute:

1. **Fork the Repository**

2. **Create a Feature Branch:**

   ```bash
   git checkout -b feature/your-new-feature
   ```

3. **Commit Your Changes:**  
   Follow the established commit message conventions.

4. **Push to Your Fork:**

   ```bash
   git push origin feature/your-new-feature
   ```

5. **Submit a Pull Request:**  
   Provide a clear description of your changes and any related issues.

For additional guidelines, refer to [Contributing Guidelines](CONTRIBUTING.md) if available.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Roadmap

Planned future enhancements include:
- **Client-Side Encryption:** Improved end-to-end encryption features.
- **Advanced Search Capabilities:** Full-text and metadata-based search.
- **Event Webhooks:** Real-time notifications for file operations.
- **Multi-Cluster & Multi-Data Center Support:** Further scaling the storage backend.
- **AI-Powered Storage Optimization:** Intelligent tiering based on usage patterns.

---

## Acknowledgments

- Thanks to the [NestJS Team](https://nestjs.com/) for providing a robust framework.
- Appreciation to the developers behind BullMQ, Redis, and PostgreSQL.
- Many thanks to all contributors who continuously improve VaultX.


