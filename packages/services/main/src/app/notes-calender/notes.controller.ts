import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  createNote(@Body() data: any) {
    return this.notesService.createNote(data);
  }

  @Get(':noteId')
  getNoteById(@Param('noteId') noteId: string) {
    return this.notesService.getNoteById(noteId);
  }

  @Get('user/:userId')
  getUserNotes(@Param('userId') userId: string) {
    return this.notesService.getUserNotes(userId);
  }

  @Put(':noteId')
  updateNote(@Param('noteId') noteId: string, @Body() data: any) {
    return this.notesService.updateNote(noteId, data);
  }

  @Delete(':noteId')
  deleteNote(@Param('noteId') noteId: string) {
    return this.notesService.deleteNote(noteId);
  }

  @Put(':noteId/archive')
  archiveNote(@Param('noteId') noteId: string) {
    return this.notesService.archiveNote(noteId);
  }

  @Put(':noteId/pin')
  pinNote(@Param('noteId') noteId: string) {
    return this.notesService.pinNote(noteId);
  }

  @Put(':noteId/tags/add')
  addTags(@Param('noteId') noteId: string, @Body('tags') tags: string[]) {
    return this.notesService.addTags(noteId, tags);
  }

  @Put(':noteId/tags/remove')
  removeTags(@Param('noteId') noteId: string, @Body('tags') tags: string[]) {
    return this.notesService.removeTags(noteId, tags);
  }

  @Put(':noteId/share')
  shareNote(@Param('noteId') noteId: string, @Body('userId') userId: string) {
    return this.notesService.shareNote(noteId, userId);
  }

  @Put(':noteId/unshare')
  unshareNote(@Param('noteId') noteId: string, @Body('userId') userId: string) {
    return this.notesService.unshareNote(noteId, userId);
  }
}
