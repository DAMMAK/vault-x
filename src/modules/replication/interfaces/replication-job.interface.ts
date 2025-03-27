export interface ReplicationJob {
  fileId: string;
  userId: string;
  sourceRegion: string;
  targetRegions: string[];
}
