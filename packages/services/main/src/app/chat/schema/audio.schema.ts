import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AudioMessageDocument = AudioMessageEntity & Document;

@Schema({ timestamps: true })
export class AudioMessageEntity {
    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    senderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    receiverId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'ChatRoom', required: true })
    chatRoomId: Types.ObjectId;

    @Prop({ required: true }) // URL of the audio file
    audioUrl: string;

    @Prop({ required: true }) // Duration in seconds
    duration: number;
}

export const AudioMessageSchema = SchemaFactory.createForClass(AudioMessageEntity);
