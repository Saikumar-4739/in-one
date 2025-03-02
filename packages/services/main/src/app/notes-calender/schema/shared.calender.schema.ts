import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SharedCalendarDocument = SharedCalendar & Document;

class SharedEvent {
  @Prop({ required: true })
  title: string; // Event title

  @Prop({ default: '' })
  description: string; // Event description

  @Prop({ required: true })
  startDate: Date; // Event start date & time

  @Prop({ required: true })
  endDate: Date; // Event end date & time

  @Prop({ default: '' })
  location: string; // Event location

  @Prop({ type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' })
  status: 'upcoming' | 'completed' | 'cancelled'; // Event status
}

@Schema({ timestamps: true })
export class SharedCalendar {
  @Prop({ required: true })
  calendarOwnerId: string; // User ID of the calendar owner

  @Prop({ type: [String], required: true })
  sharedWith: string[]; // List of user IDs the calendar is shared with

  @Prop({ type: [SharedEvent], default: [] })
  events: SharedEvent[];
}

export const SharedCalendarSchema = SchemaFactory.createForClass(SharedCalendar);
