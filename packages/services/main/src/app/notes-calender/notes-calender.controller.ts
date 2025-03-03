import { Controller, Post, Body } from '@nestjs/common';
import { NotesService } from './notes.service';
import { ApiBody } from '@nestjs/swagger';
import { CommonResponse, CreateCalendarEventModel, CreateCalendarModel, CreateNoteModel, UpdateNoteModel } from '@in-one/shared-models';
import { CalendarService } from './calender.service';

@Controller('notes')
export class NotesCalenderController {
    constructor(
        private readonly notesService: NotesService,
        private readonly calendarService: CalendarService
    ) { }

    @Post('create')
    @ApiBody({ schema: { properties: { title: { type: 'string' }, content: { type: 'string' }, userId: { type: 'string' } } } })
    async create(@Body() createNoteDto: CreateNoteModel): Promise<CommonResponse> {
        try {
            const response = await this.notesService.create(createNoteDto);
            return response;
        } catch (error) {
            console.error('❌ Error creating note:', error);
            return new CommonResponse(false, 500, 'Error creating note', error);
        }
    }

    @Post('update')
    @ApiBody({ schema: { properties: { id: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' }, userId: { type: 'string' } } } })
    async update(@Body() body: { id: string } & UpdateNoteModel): Promise<CommonResponse> {
        try {
            const { id, ...updateData } = body;
            const response = await this.notesService.update(id, updateData);
            return response;
        } catch (error) {
            console.error('❌ Error updating note:', error);
            return new CommonResponse(false, 500, 'Error updating note', error);
        }
    }

    @Post('delete')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async remove(@Body() body: { id: string }): Promise<CommonResponse> {
        try {
            const response = await this.notesService.remove(body.id);
            return response;
        } catch (error) {
            console.error('❌ Error deleting note:', error);
            return new CommonResponse(false, 500, 'Error deleting note', error);
        }
    }

    @Post('findAll')
    @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
    async findAll(@Body('userId') userId: string): Promise<CommonResponse> {
        try {
            const response = await this.notesService.findAll(userId);
            return response;
        } catch (error) {
            console.error('❌ Error retrieving notes:', error);
            return new CommonResponse(false, 500, 'Error retrieving notes', error);
        }
    }

    @Post('findOne')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async findOne(@Body('id') id: string): Promise<CommonResponse> {
        try {
            const response = await this.notesService.findOne(id);
            return response;
        } catch (error) {
            console.error('❌ Error retrieving note:', error);
            return new CommonResponse(false, 500, 'Error retrieving note', error);
        }
    }

    @Post('togglePin')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async togglePin(@Body('id') id: string): Promise<CommonResponse> {
        try {
            const response = await this.notesService.togglePin(id);
            return response;
        } catch (error) {
            console.error('❌ Error toggling pin:', error);
            return new CommonResponse(false, 500, 'Error toggling pin', error);
        }
    }

    @Post('toggleArchive')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async toggleArchive(@Body('id') id: string): Promise<CommonResponse> {
        try {
            const response = await this.notesService.toggleArchive(id);
            return response;
        } catch (error) {
            console.error('❌ Error toggling archive:', error);
            return new CommonResponse(false, 500, 'Error toggling archive', error);
        }
    }

    @Post('search')
    @ApiBody({ schema: { properties: { query: { type: 'string' }, userId: { type: 'string' } } } })
    async search(@Body() body: { query: string; userId: string }): Promise<CommonResponse> {
        try {
            const response = await this.notesService.search(body.query, body.userId);
            return response;
        } catch (error) {
            console.error('❌ Error searching notes:', error);
            return new CommonResponse(false, 500, 'Error searching notes', error);
        }
    }

    @Post('countUserNotes')
    @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
    async countUserNotes(@Body('userId') userId: string): Promise<CommonResponse> {
        try {
            const response = await this.notesService.countUserNotes(userId);
            return response;
        } catch (error) {
            console.error('❌ Error counting notes:', error);
            return new CommonResponse(false, 500, 'Error counting notes', error);
        }
    }

    @Post('create')
    @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
    async createCalnder(@Body() body: { calendar: CreateCalendarModel, event: CreateCalendarEventModel }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.create(body.calendar, body.event);
        return response;
      } catch (error) {
        console.error('❌ Error creating calendar and event:', error);
        return new CommonResponse(false, 500, 'Error creating calendar and event', error);
      }
    }
  
    @Post('getAll')
    @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
    async getAllCalendars(@Body() body: { userId: string }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.getAllCalendars(body.userId);
        return response;
      } catch (error) {
        console.error('❌ Error retrieving calendars:', error);
        return new CommonResponse(false, 500, 'Error retrieving calendars', error);
      }
    }
  
    @Post('getById')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async getCalendarById(@Body() body: { id: string }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.getCalendarById(body.id);
        return response;
      } catch (error) {
        console.error('❌ Error retrieving calendar:', error);
        return new CommonResponse(false, 500, 'Error retrieving calendar', error);
      }
    }
  
    @Post('delete')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async delete(@Body() body: { id: string }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.delete(body.id);
        return response;
      } catch (error) {
        console.error('❌ Error deleting calendar and events:', error);
        return new CommonResponse(false, 500, 'Error deleting calendar and events', error);
      }
    }
  
    @Post('addEvent')
    @ApiBody({ schema: { properties: { calendarId: { type: 'string' }, event: { type: 'object' } } } })
    async addEvent(@Body() body: { calendarId: string, event: CreateCalendarEventModel }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.addEvent(body.calendarId, body.event);
        return response;
      } catch (error) {
        console.error('❌ Error adding event:', error);
        return new CommonResponse(false, 500, 'Error adding event', error);
      }
    }
  
    @Post('updateEvent')
    @ApiBody({ schema: { properties: { id: { type: 'string' }, event: { type: 'object' } } } })
    async updateEvent(@Body() body: { id: string, event: any }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.updateEvent(body.id, body.event);
        return response;
      } catch (error) {
        console.error('❌ Error updating event:', error);
        return new CommonResponse(false, 500, 'Error updating event', error);
      }
    }
  
    @Post('deleteEvent')
    @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
    async deleteEvent(@Body() body: { id: string }): Promise<CommonResponse> {
      try {
        const response = await this.calendarService.deleteEvent(body.id);
        return response;
      } catch (error) {
        console.error('❌ Error deleting event:', error);
        return new CommonResponse(false, 500, 'Error deleting event', error);
      }
    }
}
