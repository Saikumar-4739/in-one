import { Controller, Post, Body } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CommonResponse, CreateNoteModel, MeetingEventModel, UpdateNoteModel } from '@in-one/shared-models';
import { CalendarService } from './calender.service';

@Controller('notes-calender')
export class NotesCalenderController {
  constructor(
    private readonly notesService: NotesService,
    private readonly calendarService: CalendarService
  ) { }

  @Post('createNote')
  async createNote(@Body() createNoteDto: CreateNoteModel): Promise<CommonResponse> {
    try {
      const response = await this.notesService.createNote(createNoteDto);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error creating note', error);
    }
  }

  @Post('updateNote')
  async updateNote(@Body() body: { id: string; userId: string } & UpdateNoteModel): Promise<CommonResponse> {
    try {
      const { id, userId, ...updateData } = body;
      const response = await this.notesService.updateNote(id, updateData, userId);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating note', error);
    }
  }

  @Post('getUserNotes')
  async getUserNotes(@Body() body: { userId: string; includeArchived?: boolean }): Promise<CommonResponse> {
    try {
      const response = await this.notesService.getUserNotes(body.userId, body.includeArchived);
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

  @Post('createEvent')
  async createEvent(@Body() body: { userId: string; event: MeetingEventModel }): Promise<CommonResponse> {
    try {
      const response = await this.calendarService.createEvent(body.userId, body.event);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error creating event', error);
    }
  }

  @Post('getUserEvents')
  async getUserEvents(@Body() body: { userId: string }): Promise<CommonResponse> {
    try {
      const response = await this.calendarService.getUserEvents(body.userId);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving user events', error);
    }
  }

  @Post('getEventById')
  async getEventById(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      const response = await this.calendarService.getEventById(body.id);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving event', error);
    }
  }

  @Post('deleteEvent')
  async deleteEvent(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      const response = await this.calendarService.deleteEvent(body.id);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting event', error);
    }
  }

  @Post('updateEvent')
  async updateEvent(@Body() body: { id: string; event: Partial<MeetingEventModel> }): Promise<CommonResponse> {
    try {
      const response = await this.calendarService.updateEvent(body.id, body.event);
      return response;
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating event', error);
    }
  }
}