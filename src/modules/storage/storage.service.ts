import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StorageNode } from './entities/storage-node.entity';
import { Region } from './entities/region.entity';
import { CreateStorageNodeDto } from './dto/create-storage-node.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { File } from '../files/entities/file.entity';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>,
    @InjectRepository(StorageNode)
    private storageNodesRepository: Repository<StorageNode>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
  ) {}

  async createRegion(createRegionDto: CreateRegionDto): Promise<Region> {
    const newRegion = this.regionsRepository.create({
      id: uuidv4(),
      name: createRegionDto.name,
      description: createRegionDto.description,
      location: createRegionDto.location,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.regionsRepository.save(newRegion);

    return newRegion;
  }

  async getRegions(): Promise<Region[]> {
    return this.regionsRepository.findBy({ active: true });
  }

  async getRegionById(id: string): Promise<Region> {
    const region = await this.regionsRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    return region;
  }

  async getRegionByName(name: string): Promise<Region> {
    const region = await this.regionsRepository.findOneBy({
      name,
      active: true,
    });

    if (!region) {
      throw new NotFoundException(`Region with name ${name} not found`);
    }

    return region;
  }

  async deactivateRegion(id: string): Promise<Region> {
    const region = await this.getRegionById(id);

    region.active = false;
    await this.regionsRepository.save(region);

    return region;
  }

  async createStorageNode(
    createStorageNodeDto: CreateStorageNodeDto,
  ): Promise<StorageNode> {
    // Verify region exists
    await this.getRegionById(createStorageNodeDto.regionId);

    const newNode = this.storageNodesRepository.create({
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
    });

    await this.storageNodesRepository.save(newNode);

    return newNode;
  }

  async getStorageNodes(): Promise<StorageNode[]> {
    return this.storageNodesRepository.findBy({ status: 'online' });
  }

  async getStorageNodeById(id: string): Promise<StorageNode> {
    const node = await this.storageNodesRepository.findOneBy({ id });
    if (!node) {
      throw new NotFoundException(`Storage node with ID ${id} not found`);
    }
    return node;
  }

  async getStorageNodesInRegion(regionId: string): Promise<StorageNode[]> {
    return this.storageNodesRepository.findBy({
      regionId,
      status: 'online',
    });
  }

  async updateStorageNodeStatus(
    id: string,
    status: string,
  ): Promise<StorageNode> {
    const node = await this.getStorageNodeById(id);

    node.status = status;

    await this.storageNodesRepository.save(node);

    return node;
  }

  async saveStorageNode(node: StorageNode): Promise<void> {
    await this.storageNodesRepository.save(node);
  }

  private async saveFile(file: File): Promise<void> {
    await this.filesRepository.save(file);
  }
}
