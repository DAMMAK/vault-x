import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Riak from 'basho-riak-client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './interfaces/user.interface';
import { RIAK_BUCKETS } from '@common/constants/index';

@Injectable()
export class UsersService {
  private client: any;

  constructor(private configService: ConfigService) {
    const riakNodes = this.configService.get('riak.nodes');
    const riakProtocol = this.configService.get('riak.protocol');

    this.client = new Riak.Client(riakNodes, riakProtocol);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser: User = {
      id: uuidv4(),
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword,
      organization: createUserDto.organization,
      roles: ['user'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveUser(newUser);

    // Don't return the password
    const { password, ...result } = newUser;
    return result as User;
  }

  async findAll(): Promise<User[]> {
    const fetchOp = new Riak.Commands.KV.ListKeys.Builder()
      .withBucket(RIAK_BUCKETS.USERS)
      .build();

    const keys = await this.executeRiakOperation(fetchOp);
    const users = await Promise.all(keys.map((key) => this.findOne(key)));

    return users.map((user) => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string): Promise<User> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.USERS)
      .withKey(id)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return result.values[0].value;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      // In a real implementation, we'd use secondary indexes or search
      // For simplicity, we're doing a full scan (not efficient for production)
      const users = await this.findAll();
      return users.find((user) => user.email === email) || null;
    } catch (error) {
      return null;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const updatedUser = {
      ...user,
      ...updateUserDto,
      updatedAt: new Date().toISOString(),
    };

    if (updateUserDto.password) {
      updatedUser.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.saveUser(updatedUser);

    const { password, ...result } = updatedUser;
    return result as User;
  }

  async remove(id: string): Promise<void> {
    const deleteOp = new Riak.Commands.KV.DeleteValue.Builder()
      .withBucket(RIAK_BUCKETS.USERS)
      .withKey(id)
      .build();

    await this.executeRiakOperation(deleteOp);
  }

  private async saveUser(user: User): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.USERS)
      .withKey(user.id)
      .withContent(user)
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
}
