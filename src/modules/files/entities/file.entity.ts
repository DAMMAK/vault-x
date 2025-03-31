import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chunk } from './chunk.entity';

@Entity()
export class File {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  ownerId: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  hash: string;

  @OneToMany(() => Chunk, (chunk) => chunk.file)
  chunks: Chunk[];

  @Column('simple-array')
  regions: string[];

  @Column('simple-array')
  replicatedTo: string[];

  @Column()
  compressionEnabled: boolean;

  @Column()
  deduplicationEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
