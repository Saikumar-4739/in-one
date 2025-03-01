import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true })
export class ChatRoom {
    @Prop({ default: '' })
    name: string; 
  
    @Prop({ type: [{ type: Types.ObjectId, ref: 'UserEntity' }], required: true })
    participants: Types.ObjectId[]; 
  
    @Prop({ default: false })
    isGroup: boolean;
  
    @Prop({ default: false })
    isSecret: boolean; 
  
    @Prop({ default: '' })
    lastMessage: string;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
