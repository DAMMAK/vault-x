export interface StorageNode {
  id: string;
  name: string;
  hostname: string;
  port: number;
  regionId: string;
  capacity: number;
  available: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
