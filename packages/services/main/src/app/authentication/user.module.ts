import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity, UserSchema } from './schema/user.schema';
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  providers: [UserService, UserRepository],
  controllers: [UserController],
  exports: [UserService, JwtModule],
})
export class UserModule {}
