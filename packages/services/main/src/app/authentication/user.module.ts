import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager'; // ✅ FIXED: Import from @nestjs/cache-manager
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from './schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    JwtModule.register({}),
    CacheModule.register({ isGlobal: true, ttl: 300 }), // ✅ Register CacheModule properly
  ],
  controllers: [UserController],
  providers: [UserService, GenericTransactionManager,],
  exports: [UserService],
})
export class UserModule {}
