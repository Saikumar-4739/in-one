import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from 'typeorm';
import { NotesRepository } from './repository/notes.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CommonResponse, CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesRepository)
    private notesRepository: NotesRepository,
    private readonly transactionManager: GenericTransactionManager,
  ) { }

  async createNote(createNoteDto: CreateNoteModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      // Validate required fields
      if (!createNoteDto.title || !createNoteDto.content || !createNoteDto.userId) {
        throw new Error('Title, content, and userId are required');
      }

      const noteRepo = this.transactionManager.getRepository(this.notesRepository);
      const noteData = {
        ...createNoteDto,
        userId: createNoteDto.userId, // Simple string, not an object
        isPinned: createNoteDto.isPinned ?? false,
        isArchived: createNoteDto.isArchived ?? false,
        attachments: createNoteDto.attachments ?? [],
        sharedWith: createNoteDto.sharedWith ?? [],
      };

      const newNote = noteRepo.create(noteData);
      const savedNote = await noteRepo.save(newNote);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Note created successfully', savedNote);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating note:', error);
      return new CommonResponse(false, 500, 'Failed to create note', error);
    }
  }

  async updateNote(id: string, updateNoteDto: UpdateNoteModel, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const noteRepo = this.transactionManager.getRepository(this.notesRepository);
      const existingNote = await noteRepo.findOne({ where: { id, userId } });

      if (!existingNote) {
        throw new Error('Note not found or unauthorized');
      }

      const updatedNote = noteRepo.merge(existingNote, updateNoteDto);
      const savedNote = await noteRepo.save(updatedNote);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Note updated successfully', savedNote);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating note:', error);
      return new CommonResponse(false, 500, 'Failed to update note', error);
    }
  }

  async getUserNotes(userId: string, includeArchived: boolean = false): Promise<CommonResponse> {
    try {
      const whereClause = includeArchived ? { userId } : { userId, isArchived: false };

      const notes = await this.notesRepository.find({
        where: whereClause,
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC',
        },
      });
      return new CommonResponse(true, 200, 'Notes retrieved successfully', notes);
    } catch (error) {
      console.error('❌ Error retrieving notes:', error);
      return new CommonResponse(false, 500, 'Failed to retrieve notes', error);
    }
  }

  async togglePin(id: string, userId: string): Promise<CommonResponse> {
    try {
      const note = await this.notesRepository.findOne({ where: { id, userId } });

      if (!note) {
        throw new Error('Note not found or unauthorized');
      }

      note.isPinned = !note.isPinned;
      const savedNote = await this.notesRepository.save(note);
      return new CommonResponse(
        true,
        200,
        `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
        savedNote,
      );
    } catch (error) {
      console.error('❌ Error toggling pin:', error);
      return new CommonResponse(false, 500, 'Failed to toggle pin', error);
    }
  }

  async toggleArchive(id: string, userId: string): Promise<CommonResponse> {
    try {
      const note = await this.notesRepository.findOne({ where: { id, userId } });

      if (!note) {
        throw new Error('Note not found or unauthorized');
      }

      note.isArchived = !note.isArchived;
      const savedNote = await this.notesRepository.save(note);
      return new CommonResponse(
        true,
        200,
        `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`,
        savedNote,
      );
    } catch (error) {
      console.error('❌ Error toggling archive:', error);
      return new CommonResponse(false, 500, 'Failed to toggle archive', error);
    }
  }

  async searchNote(userId: string, query: string): Promise<CommonResponse> {
    try {
      if (!query) {
        throw new Error('Search query cannot be empty');
      }

      const notes = await this.notesRepository.find({
        where: [
          { title: Like(`%${query}%`), userId },
          { content: Like(`%${query}%`), userId },
        ],
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC',
        },
      });
      return new CommonResponse(true, 200, 'Notes found successfully', notes);
    } catch (error) {
      console.error('❌ Error searching notes:', error);
      return new CommonResponse(false, 500, 'Failed to search notes', error);
    }
  }

  async countUserNotes(userId: string): Promise<CommonResponse> {
    try {
      const [total, active, archived] = await Promise.all([
        this.notesRepository.count({ where: { userId } }),
        this.notesRepository.count({ where: { userId, isArchived: false } }),
        this.notesRepository.count({ where: { userId, isArchived: true } }),
      ]);

      const counts = { total, active, archived };
      return new CommonResponse(true, 200, 'Note counts retrieved successfully', counts);
    } catch (error) {
      console.error('❌ Error counting notes:', error);
      return new CommonResponse(false, 500, 'Failed to count notes', error);
    }
  }
}
