import { Controller, Post, Body } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CommonResponse, CreateNoteModel, GetUserNotesModel, UpdateNoteModel } from '@in-one/shared-models';

@Controller('notes-calender')
export class NotesCalenderController {
  constructor(
    private readonly notesService: NotesService,
  ) { }

  @Post('createNote')
  async createNote(@Body() reqModel: CreateNoteModel): Promise<CommonResponse> {
    try {
      const response = await this.notesService.createNote(reqModel);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error creating note', error);
    }
  }

  @Post('updateNote')
  async updateNote(@Body() reqModel: UpdateNoteModel ): Promise<CommonResponse> {
    try {
      const response = await this.notesService.updateNote(reqModel);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating note', error);
    }
  }

  @Post('getUserNotes')
  async getUserNotes(@Body() reqModel: GetUserNotesModel): Promise<CommonResponse> {
    try {
      const response = await this.notesService.getUserNotes(reqModel);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving notes', error);
    }
  }

  @Post('togglePin')
  async togglePin(@Body() body: { id: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.togglePin(body.id, body.userId);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error toggling pin', error);
    }
  }

  @Post('toggleArchive')
  async toggleArchive(@Body() body: { id: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.toggleArchive(body.id, body.userId);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error toggling archive', error);
    }
  }

  @Post('searchNote')
  async searchNote(@Body() body: { query: string; userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.searchNote(body.userId, body.query);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error searching notes', error);
    }
  }

  @Post('countUserNotes')
  async countUserNotes(@Body() body: { userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.countUserNotes(body.userId);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error counting notes', error);
    }
  }
}