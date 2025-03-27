export interface Chunk {
  id: string;
  fileId: string;
  index: number;
  size: number;
  hash: string | null;
  status: string;
}
