import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarDocument = Calendar & Document;

class Event {
  @Prop({ required: true })
  title: string; // Event title

  @Prop({ default: '' })
  description: string; // Event description

  @Prop({ required: true })
  startDate: Date; // Event start date & time

  @Prop({ required: true })
  endDate: Date; // Event end date & time

  @Prop({ default: '' })
  location: string; // Event location (optional)

  @Prop({ default: null })
  reminder: Date; // Reminder date/time

  @Prop({ default: false })
  isAllDay: boolean; // Whether it's an all-day event

  @Prop({ type: [String], default: [] })
  participants: string[]; // List of user IDs for shared events

  @Prop({ default: false })
  isRecurring: boolean; // Whether the event repeats (recurring)

  @Prop({ default: null })
  recurringRule: string; // Recurrence rule (daily, weekly, etc.)

  @Prop({ type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' })
  status: string; // Event status
}

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ required: true })
  userId: string; // User ID of the calendar owner

  @Prop({ type: [Event], default: [] })
  events: Event[];
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
