import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from './region.entity';

@Entity()
export class StorageNode {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  hostname: string;

  @Column()
  port: number;

  @Column()
  regionId: string;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'regionId' })
  region: Region;

  @Column()
  capacity: number;

  @Column()
  available: number;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
