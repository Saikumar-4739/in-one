import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NoteDocument = Note & Document;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true })
  user: string; // User ID who owns the note

  @Prop({ default: '' })
  title: string; // Note title

  @Prop({ default: '' })
  content: string; // Note body (supports markdown)

  @Prop({ type: [String], default: [] })
  attachments: string[]; // File & image URLs

  @Prop({ default: false })
  isArchived: boolean; // Archive status

  @Prop({ default: false })
  isPinned: boolean; // Pinned notes

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags for categorization

  @Prop({ default: '' })
  voiceNoteUrl: string; // Voice-to-text audio file

  @Prop({ type: [String], default: [] })
  sharedWith: string[]; // List of shared user IDs
}

export const NoteSchema = SchemaFactory.createForClass(Note);
