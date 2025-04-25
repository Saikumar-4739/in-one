import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { NotesRepository } from './repository/notes.repository';
import { CommonResponse, CreateNoteModel, GetUserNotesModel, NotesIdRequestModel, UpdateNoteModel } from '@in-one/shared-models';
import { NoteEntity } from './entities/notes.entity';
import { UserEntity } from 'src/app/user/entities/user.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesRepository)
    private notesRepository: NotesRepository,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>
  ) {}

  async createNote(reqModel: CreateNoteModel): Promise<CommonResponse> {
    try {
      if (!reqModel.title || !reqModel.content || !reqModel.userId) {
        throw new Error('Title, content, and userId are required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: reqModel.userId }});
      if (!existingUser) {
        throw new Error('User not found');
      }

      const noteData = new NoteEntity();
      noteData.userId = reqModel.userId;
      noteData.title = reqModel.title;
      noteData.content = reqModel.content;
      noteData.color = reqModel.color ?? '#ffffff';
      noteData.tags = reqModel.tags ?? [];
      noteData.reminderAt = reqModel.reminderAt ?? null;
      noteData.isArchived = false;
      noteData.isPinned = false;
      noteData.isDeleted = false;

      const savedNote = await this.notesRepository.save(noteData);

      return new CommonResponse(true, 0, 'Note created successfully', savedNote);
    } catch (error) {
      return new CommonResponse(true, 0, 'Note created failed', error);
    }
  }

  async updateNote(reqModel: UpdateNoteModel): Promise<CommonResponse> {
    try {
      if (!reqModel.notesId || !reqModel.userId) {
        throw new Error('Note ID and user ID are required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const existingNote = await this.notesRepository.findOne({
        where: { id: reqModel.notesId, userId: reqModel.userId, isDeleted: false },
      });

      if (!existingNote) {
        throw new Error('Note not found, unauthorized, or deleted');
      }

      existingNote.title = reqModel.title ?? existingNote.title;
      existingNote.content = reqModel.content ?? existingNote.content;
      existingNote.color = reqModel.color ?? existingNote.color;
      existingNote.tags = reqModel.tags ?? existingNote.tags;
      existingNote.reminderAt = reqModel.reminderAt ?? existingNote.reminderAt;
      existingNote.updatedAt = new Date();

      const savedNote = await this.notesRepository.save(existingNote);

      return new CommonResponse(true, 200, 'Note updated successfully', savedNote);
    } catch (error) {
      return new CommonResponse(true, 0, 'Note Update failed', error);
    }
  }

  async getUserNotes(reqModel: GetUserNotesModel): Promise<CommonResponse> {
    try {
      if (!reqModel.userId) {
        throw new Error('User ID is required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const whereClause = reqModel.includeArchived ? { userId: reqModel.userId, isDeleted: false }
        : { userId: reqModel.userId, isArchived: false, isDeleted: false };

      const notes = await this.notesRepository.find({
        where: whereClause,
        order: { isPinned: 'DESC', priority: 'DESC', createdAt: 'DESC' }
      });

      return new CommonResponse(true, 0, 'Notes retrieved successfully', notes);
    } catch (error) {
      return new CommonResponse(false, 1, 'Notes retrieved failed', error);
    }
  }

  async togglePin(id: string, userId: string): Promise<CommonResponse> {
    try {
      if (!id || !userId) {
        throw new Error('Note ID and user ID are required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const note = await this.notesRepository.findOne({ where: { id, userId, isDeleted: false } });
      if (!note) {
        throw new Error('Note not found, unauthorized, or deleted');
      }

      note.isPinned = !note.isPinned;
      note.updatedAt = new Date();

      const savedNote = await this.notesRepository.save(note);

      return new CommonResponse(true, 0, `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`, savedNote);
    } catch (error) {
      return new CommonResponse(false, 1, 'Pin Failed', error);
    }
  }

  async toggleArchive(id: string, userId: string): Promise<CommonResponse> {
    try {
      if (!id || !userId) {
        throw new Error('Note ID and user ID are required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const note = await this.notesRepository.findOne({ where: { id, userId, isDeleted: false } });
      if (!note) {
        throw new Error('Note not found, unauthorized, or deleted');
      }

      note.isArchived = !note.isArchived;
      note.archivedAt = note.isArchived ? new Date() : null;
      note.updatedAt = new Date();

      const savedNote = await this.notesRepository.save(note);

      return new CommonResponse(true, 200, `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`, savedNote);
    } catch (error) {
      return new CommonResponse(false, 1, 'Archive Failed', error);
    }
  }

  async searchNote(userId: string, query: string): Promise<CommonResponse> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!query) {
        throw new Error('Search query cannot be empty');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const notes = await this.notesRepository.find({
        where: [
          { title: Like(`%${query}%`), userId, isDeleted: false },
          { content: Like(`%${query}%`), userId, isDeleted: false },
          { tags: Like(`%${query}%`), userId, isDeleted: false },
        ],
        order: { isPinned: 'DESC', priority: 'DESC', createdAt: 'DESC' },
      });

      return new CommonResponse(true, 200, 'Notes found successfully', notes);
    } catch (error) {
      return new CommonResponse(false, 1, 'Failed to search notes', error);
    }
  }

  async countUserNotes(userId: string): Promise<CommonResponse> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const existingUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      const [total, active, archived, deleted, highPriority] = await Promise.all([
        this.notesRepository.count({ where: { userId } }),
        this.notesRepository.count({ where: { userId, isArchived: false, isDeleted: false } }),
        this.notesRepository.count({ where: { userId, isArchived: true, isDeleted: false } }),
        this.notesRepository.count({ where: { userId, isDeleted: true } }),
        this.notesRepository.count({ where: { userId, priority: 1, isDeleted: false } }),
      ]);

      const counts = { total, active, archived, deleted, highPriority };
      return new CommonResponse(true, 200, 'Note counts retrieved successfully', counts);
    } catch (error) {
      return new CommonResponse(false, 1, 'Note Count Not Found', error);
    }
  }

  async deleteNote(reqModel: NotesIdRequestModel): Promise<CommonResponse> {
    try {
      if (!reqModel.notesId) {
        throw new Error('Note ID is required');
      }

      const existingNote = await this.notesRepository.findOne({where: { id: reqModel.notesId }});
      if (!existingNote) {
        throw new Error('Note not found');
      }

      const deleteResult = await this.notesRepository.delete({id: reqModel.notesId});
      if (deleteResult.affected === 0) {
        throw new Error('Failed to delete note');
      }
      return new CommonResponse(true, 0, 'Note deleted successfully');
    } catch (error) {
      return new CommonResponse(false, 1, 'Note Delete Failed')
    }
  }
}