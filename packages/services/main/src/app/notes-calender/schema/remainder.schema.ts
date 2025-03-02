import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReminderDocument = Reminder & Document;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ required: true })
  userId: string; // User ID for whom the reminder is set

  @Prop({ required: true })
  eventId: string; // Linked event ID

  @Prop({ type: Date, required: true })
  reminderDate: Date; // Date and time of the reminder

  @Prop({ type: String, enum: ['AI-based', 'User-set'], default: 'User-set' })
  reminderType: 'AI-based' | 'User-set'; // Type of reminder

  @Prop({ default: '' })
  message: string; // Custom reminder message

  @Prop({ default: false })
  isNotified: boolean; // Whether the user has been notified
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
