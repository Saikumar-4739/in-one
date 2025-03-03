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
        private readonly transactionManager: GenericTransactionManager
    ) { }

    async create(createNoteDto: CreateNoteModel): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const newNote = noteRepo.create(createNoteDto);
            const savedNote = await noteRepo.save(newNote);
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Note created successfully', savedNote);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error creating note:', error);
            return new CommonResponse(false, 500, 'Error creating note', error);
        }
    }

    async update(id: string, updateNoteDto: UpdateNoteModel): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const existingNote = await noteRepo.findOne({ where: { id } });
            if (!existingNote) {
                throw new Error('Note not found');
            }
            const updatedNote = noteRepo.merge(existingNote, updateNoteDto);
            const savedNote = await noteRepo.save(updatedNote);
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Note updated successfully', savedNote);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error updating note:', error);
            return new CommonResponse(false, 500, 'Error updating note', error);
        }
    }

    async remove(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const note = await noteRepo.findOne({ where: { id } });
            if (!note) {
                throw new Error('Note not found');
            }
            await noteRepo.remove(note);
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Note deleted successfully', null);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error deleting note:', error);
            return new CommonResponse(false, 500, 'Error deleting note', error);
        }
    }

    async bulkCreate(notes: CreateNoteModel[]): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const createdNotes = [];
            for (let noteDto of notes) {
                const newNote = noteRepo.create(noteDto);
                const savedNote = await noteRepo.save(newNote);
                createdNotes.push(savedNote);
            }
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Bulk notes created successfully', createdNotes);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error in bulk create:', error);
            return new CommonResponse(false, 500, 'Error in bulk create', error);
        }
    }

    async findAll(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const notes = await noteRepo.find({ where: { id } });
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Notes retrieved successfully', notes);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error retrieving notes:', error);
            return new CommonResponse(false, 500, 'Error retrieving notes', error);
        }
    }

    async findOne(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const note = await noteRepo.findOne({ where: { id } });
            if (!note) {
                throw new Error('Note not found');
            }
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Note retrieved successfully', note);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error retrieving note:', error);
            return new CommonResponse(false, 500, 'Error retrieving note', error);
        }
    }

    async togglePin(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const note = await noteRepo.findOne({ where: { id } });
            if (!note) {
                throw new Error('Note not found');
            }
            note.isPinned = !note.isPinned;
            const savedNote = await noteRepo.save(note);
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`, savedNote);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error toggling pin:', error);
            return new CommonResponse(false, 500, 'Error toggling pin', error);
        }
    }

    async toggleArchive(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const note = await noteRepo.findOne({ where: { id } });
            if (!note) {
                throw new Error('Note not found');
            }
            note.isArchived = !note.isArchived;
            const savedNote = await noteRepo.save(note);
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`, savedNote);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error toggling archive:', error);
            return new CommonResponse(false, 500, 'Error toggling archive', error);
        }
    }

    async search(query: string, id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const notes = await noteRepo.find({
                where: [
                    { title: Like(`%${query}%`), id },
                    { content: Like(`%${query}%`), id }
                ],
            });
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Notes found successfully', notes);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error searching notes:', error);
            return new CommonResponse(false, 500, 'Error searching notes', error);
        }
    }

    async countUserNotes(id: string): Promise<CommonResponse> {
        await this.transactionManager.startTransaction();
        try {
            const noteRepo = this.transactionManager.getRepository(this.notesRepository);
            const noteCount = await noteRepo.count({ where: { id } });
            await this.transactionManager.commitTransaction();
            return new CommonResponse(true, 200, 'Note count retrieved successfully', noteCount);
        } catch (error) {
            await this.transactionManager.rollbackTransaction();
            console.error('❌ Error counting notes:', error);
            return new CommonResponse(false, 500, 'Error counting notes', error);
        }
    }
}
