import { Chunk } from './chunk.entity';

export class File {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  status: string;
  hash: string;
  chunks: Chunk[];
  regions: string[];
  replicatedTo: string[];
  compressionEnabled: boolean;
  deduplicationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
