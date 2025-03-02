import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from './schema/notes.schema';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) {}

  async createNote(data: any): Promise<Note> {
    return this.noteModel.create(data);
  }

  async getNoteById(noteId: string): Promise<Note | null> {
    return this.noteModel.findById(noteId);
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return this.noteModel.find({ user: userId });
  }

  async updateNote(noteId: string, data: any): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, data, { new: true });
  }

  async deleteNote(noteId: string): Promise<any> {
    return this.noteModel.findByIdAndDelete(noteId);
  }

  async archiveNote(noteId: string): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { isArchived: true }, { new: true });
  }

  async pinNote(noteId: string): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { isPinned: true }, { new: true });
  }

  async addTags(noteId: string, tags: string[]): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { $addToSet: { tags: { $each: tags } } }, { new: true });
  }

  async removeTags(noteId: string, tags: string[]): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { $pullAll: { tags } }, { new: true });
  }

  async shareNote(noteId: string, userId: string): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { $addToSet: { sharedWith: userId } }, { new: true });
  }

  async unshareNote(noteId: string, userId: string): Promise<Note | null> {
    return this.noteModel.findByIdAndUpdate(noteId, { $pull: { sharedWith: userId } }, { new: true });
  }
}
