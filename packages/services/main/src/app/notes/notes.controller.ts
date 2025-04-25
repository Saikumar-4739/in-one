import { Controller, Post, Body } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CommonResponse, CreateNoteModel, ExceptionHandler, GetUserNotesModel, NotesIdRequestModel, UpdateNoteModel } from '@in-one/shared-models';

@Controller('notes')
export class NotesCalenderController {
  constructor(
    private readonly notesService: NotesService,
  ) { }

  @Post('createNote')
  async createNote(@Body() reqModel: CreateNoteModel): Promise<CommonResponse> {
    try {
      return await this.notesService.createNote(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating Note');
    }
  }

  @Post('updateNote')
  async updateNote(@Body() reqModel: UpdateNoteModel ): Promise<CommonResponse> {
    try {
      return await this.notesService.updateNote(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating note');
    }
  }

  @Post('getUserNotes')
  async getUserNotes(@Body() reqModel: GetUserNotesModel): Promise<CommonResponse> {
    try {
      return await this.notesService.getUserNotes(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error retrieving notes')
    }
  }

  @Post('togglePin')
  async togglePin(@Body() body: { id: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.togglePin(body.id, body.userId);
      return response;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error toggling pin')
    }
  }

  @Post('toggleArchive')
  async toggleArchive(@Body() body: { id: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.toggleArchive(body.id, body.userId);
      return response;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error toggling archive')
    }
  }

  @Post('searchNote')
  async searchNote(@Body() body: { query: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.searchNote(body.userId, body.query);
      return response;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error searching notes')
    }
  }

  @Post('countUserNotes')
  async countUserNotes(@Body() body: { userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.countUserNotes(body.userId);
      return response;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error counting notes')
    }
  }

  @Post('deleteNote')
  async deleteNote(@Body() reqModel: NotesIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.notesService.deleteNote(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error delete notes')
    }
  }
}