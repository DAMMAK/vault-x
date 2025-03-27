import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UsersController, UsersController],
  providers: [UsersService, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
