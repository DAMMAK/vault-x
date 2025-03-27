import { Chunk } from './chunk.interface';

export interface File {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  status: string;
  hash: string | null;
  chunks: Chunk[];
  regions: string[];
  replicatedTo: string[];
  compressionEnabled: boolean;
  deduplicationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
