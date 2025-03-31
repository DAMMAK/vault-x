import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { File } from './file.entity';
import { StorageNode } from 'src/modules/storage/entities/storage-node.entity';

@Entity()
export class Chunk {
  @PrimaryColumn()
  id: string;

  @Column()
  fileId: string;

  @ManyToOne(() => File, (file) => file.chunks)
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  index: number;

  @Column()
  size: number;

  @Column()
  hash: string;

  @Column()
  status: string;
  @Column({ type: 'bytea', nullable: true })
  data: Buffer;

  @Column()
  storageNodeId: string;

  @ManyToOne(() => StorageNode, (storageNode) => storageNode.id)
  @JoinColumn({ name: 'storageNodeId' })
  storageNode: StorageNode;
}
