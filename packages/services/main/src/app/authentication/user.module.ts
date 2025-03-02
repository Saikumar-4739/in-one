import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager'; // ✅ Import from @nestjs/cache-manager
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from './schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Module({
  imports: [
    ConfigModule.forRoot(), // ✅ Ensure ConfigModule is loaded
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    CacheModule.register({ isGlobal: true, ttl: 300 }), // ✅ Register CacheModule properly
  ],
  controllers: [UserController],
  providers: [UserService, GenericTransactionManager],
  exports: [UserService],
})
export class UserModule {}
