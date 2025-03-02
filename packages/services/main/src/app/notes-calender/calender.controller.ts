import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CalendarService } from './calender.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // 📅 Event Endpoints

  @Post(':userId/event')
  createEvent(@Param('userId') userId: string, @Body() data: any) {
    return this.calendarService.createEvent(userId, data);
  }

  @Get(':userId/events')
  getUserEvents(@Param('userId') userId: string) {
    return this.calendarService.getUserEvents(userId);
  }

  @Get('event/:eventId')
  getEventById(@Param('eventId') eventId: string) {
    return this.calendarService.getEventById(eventId);
  }

  @Put('event/:eventId')
  updateEvent(@Param('eventId') eventId: string, @Body() data: any) {
    return this.calendarService.updateEvent(eventId, data);
  }

  @Delete('event/:eventId')
  deleteEvent(@Param('eventId') eventId: string) {
    return this.calendarService.deleteEvent(eventId);
  }

  @Put('event/:eventId/cancel')
  cancelEvent(@Param('eventId') eventId: string) {
    return this.calendarService.cancelEvent(eventId);
  }

  @Put('event/:eventId/complete')
  markEventCompleted(@Param('eventId') eventId: string) {
    return this.calendarService.markEventCompleted(eventId);
  }

  @Put('event/:eventId/add-participant')
  addParticipant(@Param('eventId') eventId: string, @Body('userId') userId: string) {
    return this.calendarService.addParticipant(eventId, userId);
  }

  @Put('event/:eventId/remove-participant')
  removeParticipant(@Param('eventId') eventId: string, @Body('userId') userId: string) {
    return this.calendarService.removeParticipant(eventId, userId);
  }

  // 🔔 Reminder Endpoints

  @Post('reminder')
  createReminder(@Body() data: any) {
    return this.calendarService.createReminder(data);
  }

  @Get('reminders/:userId')
  getRemindersByUser(@Param('userId') userId: string) {
    return this.calendarService.getRemindersByUser(userId);
  }

  @Get('reminder/:reminderId')
  getReminderById(@Param('reminderId') reminderId: string) {
    return this.calendarService.getReminderById(reminderId);
  }

  @Put('reminder/:reminderId')
  updateReminder(@Param('reminderId') reminderId: string, @Body() data: any) {
    return this.calendarService.updateReminder(reminderId, data);
  }

  @Delete('reminder/:reminderId')
  deleteReminder(@Param('reminderId') reminderId: string) {
    return this.calendarService.deleteReminder(reminderId);
  }

  @Put('reminder/:reminderId/notified')
  markReminderNotified(@Param('reminderId') reminderId: string) {
    return this.calendarService.markReminderNotified(reminderId);
  }

  // 📆 Shared Calendar Endpoints

  @Post('shared-calendar')
  createSharedCalendar(@Body() data: any) {
    return this.calendarService.createSharedCalendar(data);
  }

  @Get('shared-calendars/:userId')
  getSharedCalendars(@Param('userId') userId: string) {
    return this.calendarService.getSharedCalendars(userId);
  }

  @Get('shared-calendar/:calendarId')
  getSharedCalendarById(@Param('calendarId') calendarId: string) {
    return this.calendarService.getSharedCalendarById(calendarId);
  }

  @Put('shared-calendar/:calendarId/add-event')
  addEventToSharedCalendar(@Param('calendarId') calendarId: string, @Body() eventData: any) {
    return this.calendarService.addEventToSharedCalendar(calendarId, eventData);
  }

  @Put('shared-calendar/:calendarId/update-event/:eventId')
  updateSharedEvent(@Param('calendarId') calendarId: string, @Param('eventId') eventId: string, @Body() data: any) {
    return this.calendarService.updateSharedEvent(calendarId, eventId, data);
  }

  @Delete('shared-calendar/:calendarId/delete-event/:eventId')
  deleteSharedEvent(@Param('calendarId') calendarId: string, @Param('eventId') eventId: string) {
    return this.calendarService.deleteSharedEvent(calendarId, eventId);
  }

  @Put('shared-calendar/:calendarId/share')
  shareCalendar(@Param('calendarId') calendarId: string, @Body('userId') userId: string) {
    return this.calendarService.shareCalendar(calendarId, userId);
  }

  @Put('shared-calendar/:calendarId/unshare')
  unshareCalendar(@Param('calendarId') calendarId: string, @Body('userId') userId: string) {
    return this.calendarService.unshareCalendar(calendarId, userId);
  }
}
