import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = MessageEntity & Document;

@Schema({ timestamps: true })
export class MessageEntity {
    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    senderId: Types.ObjectId;
  
    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    receiverId: Types.ObjectId;
  
    @Prop({ type: Types.ObjectId, ref: 'ChatRoom', required: true })
    chatRoomId: Types.ObjectId; 
  
    @Prop({ default: '' })
    text: string;
  
    @Prop({ default: null })
    emoji: string; 
  
    @Prop({ default: null })
    fileUrl: string; 
  
    @Prop({ enum: ['image', 'video', 'audio', 'document'], default: null })
    fileType: 'image' | 'video' | 'audio' | 'document';
  
    @Prop({ type: [{ type: Types.ObjectId, ref: 'UserEntity' }], default: [] })
    readBy: Types.ObjectId[]; 

    // ✅ Explicitly define createdAt
    @Prop()
    createdAt: Date;
  
    @Prop()
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
