import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from '../schema/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(UserEntity.name) 
  private readonly userModel: Model<UserEntity>) {}
}
