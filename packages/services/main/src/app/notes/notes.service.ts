import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, DataSource } from 'typeorm';
import { NotesRepository } from './repository/notes.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CommonResponse, CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';
import { NoteEntity } from './entities/notes.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesRepository)
    private notesRepository: NotesRepository,
    private readonly dataSource: DataSource,
  ) { }

  async createNote(createNoteDto: CreateNoteModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate required fields
      if (!createNoteDto.title || !createNoteDto.content || !createNoteDto.userId) {
        throw new Error('Title, content, and userId are required');
      }

      await transactionManager.startTransaction();

      const noteData = {
        ...createNoteDto,
        userId: createNoteDto.userId,
        isPinned: createNoteDto.isPinned ?? false,
        isArchived: createNoteDto.isArchived ?? false,
        attachments: createNoteDto.attachments ?? [],
        sharedWith: createNoteDto.sharedWith ?? [],
      };

      const newNote = transactionManager.getRepository(NoteEntity).create(noteData);
      const savedNote = await transactionManager.getRepository(NoteEntity).save(newNote);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 201, 'Note created successfully', savedNote);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
      return new CommonResponse(
        false,
        errorMessage.includes('required') ? 400 : 500,
        errorMessage,
        null
      );
    }
  }

  async updateNote(id: string, updateNoteDto: UpdateNoteModel, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const existingNote = await this.notesRepository.findOne({ where: { id, userId } });
      if (!existingNote) {
        throw new Error('Note not found or unauthorized');
      }

      await transactionManager.startTransaction();

      const updatedNote = transactionManager.getRepository(NoteEntity).merge(existingNote, updateNoteDto);
      const savedNote = await transactionManager.getRepository(NoteEntity).save(updatedNote);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Note updated successfully', savedNote);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve notes';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async togglePin(id: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const note = await this.notesRepository.findOne({ where: { id, userId } });
      if (!note) {
        throw new Error('Note not found or unauthorized');
      }

      await transactionManager.startTransaction();

      note.isPinned = !note.isPinned;
      const savedNote = await transactionManager.getRepository(NoteEntity).save(note);
      await transactionManager.commitTransaction();

      return new CommonResponse(
        true,
        200,
        `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
        savedNote
      );
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle pin';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async toggleArchive(id: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const note = await this.notesRepository.findOne({ where: { id, userId } });
      if (!note) {
        throw new Error('Note not found or unauthorized');
      }

      await transactionManager.startTransaction();

      note.isArchived = !note.isArchived;
      const savedNote = await transactionManager.getRepository(NoteEntity).save(note);
      await transactionManager.commitTransaction();

      return new CommonResponse(
        true,
        200,
        `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`,
        savedNote
      );
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle archive';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to search notes';
      return new CommonResponse(
        false,
        errorMessage.includes('empty') ? 400 : 500,
        errorMessage,
        null
      );
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to count notes';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }
}
