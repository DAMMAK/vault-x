import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Riak from 'basho-riak-client';
import { v4 as uuidv4 } from 'uuid';
import { StorageNode } from './interfaces/storage-node.interface';
import { Region } from './interfaces/region.interface';
import { CreateStorageNodeDto } from './dto/create-storage-node.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { RIAK_BUCKETS } from '@common/constants/index';
import { File } from '../files/entities/file.entity';

@Injectable()
export class StorageService {
  private client: any;

  constructor(private configService: ConfigService) {
    const riakNodes = this.configService.get('riak.nodes');
    const riakProtocol = this.configService.get('riak.protocol');

    this.client = new Riak.Client(riakNodes, riakProtocol);
  }

  async createRegion(createRegionDto: CreateRegionDto): Promise<Region> {
    const newRegion: Region = {
      id: uuidv4(),
      name: createRegionDto.name,
      description: createRegionDto.description,
      location: createRegionDto.location,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveRegion(newRegion);

    return newRegion;
  }

  async getRegions(): Promise<Region[]> {
    const fetchOp = new Riak.Commands.KV.ListKeys.Builder()
      .withBucket(RIAK_BUCKETS.REGIONS)
      .build();

    const keys = await this.executeRiakOperation(fetchOp);
    const regions = await Promise.all(
      keys.map((key) => this.getRegionById(key)),
    );

    return regions.filter((region) => region.active);
  }

  async getRegionById(id: string): Promise<Region> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.REGIONS)
      .withKey(id)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    return result.values[0].value;
  }

  async getRegionByName(name: string): Promise<Region> {
    const regions = await this.getRegions();
    const region = regions.find((r) => r.name === name);

    if (!region) {
      throw new NotFoundException(`Region with name ${name} not found`);
    }

    return region;
  }

  async deactivateRegion(id: string): Promise<Region> {
    const region = await this.getRegionById(id);

    region.active = false;
    region.updatedAt = new Date().toISOString();

    await this.saveRegion(region);

    return region;
  }

  async createStorageNode(
    createStorageNodeDto: CreateStorageNodeDto,
  ): Promise<StorageNode> {
    // Verify region exists
    await this.getRegionById(createStorageNodeDto.regionId);

    const newNode: StorageNode = {
      id: uuidv4(),
      name: createStorageNodeDto.name,
      hostname: createStorageNodeDto.hostname,
      port: createStorageNodeDto.port,
      regionId: createStorageNodeDto.regionId,
      capacity: createStorageNodeDto.capacity,
      available: createStorageNodeDto.capacity,
      status: 'online',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveStorageNode(newNode);

    return newNode;
  }

  async getStorageNodes(): Promise<StorageNode[]> {
    const fetchOp = new Riak.Commands.KV.ListKeys.Builder()
      .withBucket(RIAK_BUCKETS.STORAGE_NODES)
      .build();

    const keys = await this.executeRiakOperation(fetchOp);
    const nodes = await Promise.all(
      keys.map((key) => this.getStorageNodeById(key)),
    );

    return nodes.filter((node) => node.status === 'online');
  }

  async getStorageNodeById(id: string): Promise<StorageNode> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.STORAGE_NODES)
      .withKey(id)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`Storage node with ID ${id} not found`);
    }

    return result.values[0].value;
  }

  async getStorageNodesInRegion(regionId: string): Promise<StorageNode[]> {
    const nodes = await this.getStorageNodes();
    return nodes.filter((node) => node.regionId === regionId);
  }

  async updateStorageNodeStatus(
    id: string,
    status: string,
  ): Promise<StorageNode> {
    const node = await this.getStorageNodeById(id);

    node.status = status;
    node.updatedAt = new Date().toISOString();

    await this.saveStorageNode(node);

    return node;
  }

  private async saveRegion(region: Region): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.REGIONS)
      .withKey(region.id)
      .withContent(region)
      .build();

    await this.executeRiakOperation(storeOp);
  }

  async saveStorageNode(node: StorageNode): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.STORAGE_NODES)
      .withKey(node.id)
      .withContent(node)
      .build();

    await this.executeRiakOperation(storeOp);
  }

  private executeRiakOperation(operation: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.execute(operation, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  private async saveFile(file: File): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .withKey(file.id)
      .withContent(file)
      .build();

    await this.executeRiakOperation(storeOp);
  }
}
