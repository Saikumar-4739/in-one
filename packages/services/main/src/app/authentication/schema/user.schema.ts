import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserEntity & Document;

@Schema({ timestamps: true })
export class UserEntity {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  profilePicture: string;

  @Prop()
  resetPasswordOtp?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop()
  twoFactorOtp?: string;

  @Prop()
  twoFactorExpires?: Date;

  @Prop({ enum: ['online', 'offline', 'busy'], default: 'offline' })
  status: 'online' | 'offline' | 'busy';

  @Prop({ type: [String], default: [] }) 
  contacts: string[];
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
