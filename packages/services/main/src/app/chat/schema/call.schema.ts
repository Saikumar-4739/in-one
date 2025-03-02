import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallDocument = CallEntity & Document;

@Schema({ timestamps: true })
export class CallEntity {
    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    callerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
    receiverId: Types.ObjectId;

    @Prop({ enum: ['audio', 'video'], required: true })
    callType: string;

    @Prop({ default: 0 }) // Duration in seconds
    duration: number;

    @Prop({ enum: ['missed', 'completed', 'declined'], default: 'completed' })
    status: string;
}

export const CallSchema = SchemaFactory.createForClass(CallEntity);
