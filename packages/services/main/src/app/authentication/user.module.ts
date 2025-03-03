import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager'; // ✅ Import from @nestjs/cache-manager
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // ✅ Use TypeORM instead of Mongoose
import { UserEntity } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([UserEntity]), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    CacheModule.register({ isGlobal: true, ttl: 300 }), 
  ],
  controllers: [UserController],
  providers: [UserService, GenericTransactionManager, UserRepository],
  exports: [UserService],
})
export class UserModule {}
