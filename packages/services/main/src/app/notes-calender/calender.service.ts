import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Calendar, CalendarDocument } from './schema/calender.schema';
import { Reminder, ReminderDocument } from './schema/remainder.schema';
import { SharedCalendar, SharedCalendarDocument } from './schema/shared.calender.schema';


@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(Reminder.name) private reminderModel: Model<ReminderDocument>,
    @InjectModel(SharedCalendar.name) private sharedCalendarModel: Model<SharedCalendarDocument>
  ) {}

  // 📅 Calendar Events

  async createEvent(userId: string, data: any): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { userId },
      { $push: { events: data } },
      { new: true, upsert: true }
    );
  }

  async getUserEvents(userId: string): Promise<any[] | null> {
    return this.calendarModel.findOne({ userId });
  }

  async getEventById(eventId: string): Promise<any> {
    return this.calendarModel.findOne({ 'events._id': eventId }, { 'events.$': 1 });
  }

  async updateEvent(eventId: string, data: any): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $set: { 'events.$': data } },
      { new: true }
    );
  }

  async deleteEvent(eventId: string): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $pull: { events: { _id: eventId } } },
      { new: true }
    );
  }

  async cancelEvent(eventId: string): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $set: { 'events.$.status': 'cancelled' } },
      { new: true }
    );
  }

  async markEventCompleted(eventId: string): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $set: { 'events.$.status': 'completed' } },
      { new: true }
    );
  }

  async addParticipant(eventId: string, userId: string): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $addToSet: { 'events.$.participants': userId } },
      { new: true }
    );
  }

  async removeParticipant(eventId: string, userId: string): Promise<any> {
    return this.calendarModel.findOneAndUpdate(
      { 'events._id': eventId },
      { $pull: { 'events.$.participants': userId } },
      { new: true }
    );
  }

  // 🔔 Reminder Operations (Merged)

  async createReminder(data: any): Promise<Reminder> {
    return this.reminderModel.create(data);
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return this.reminderModel.find({ userId });
  }

  async getReminderById(reminderId: string): Promise<Reminder | null> {
    return this.reminderModel.findById(reminderId);
  }

  async updateReminder(reminderId: string, data: any): Promise<Reminder | null> {
    return this.reminderModel.findByIdAndUpdate(reminderId, data, { new: true });
  }

  async deleteReminder(reminderId: string): Promise<any | null> {
    return this.reminderModel.findByIdAndDelete(reminderId);
  }

  async markReminderNotified(reminderId: string): Promise<Reminder | null> {
    return this.reminderModel.findByIdAndUpdate(reminderId, { isNotified: true }, { new: true });
  }

  // 📆 Shared Calendar Operations (Merged)

  async createSharedCalendar(data: any): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.create(data);
  }

  async getSharedCalendars(userId: string): Promise<SharedCalendar[]> {
    return this.sharedCalendarModel.find({ sharedWith: userId });
  }

  async getSharedCalendarById(calendarId: string): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findById(calendarId);
  }

  async addEventToSharedCalendar(calendarId: string, eventData: any): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findByIdAndUpdate(calendarId, { $push: { events: eventData } }, { new: true });
  }

  async updateSharedEvent(calendarId: string, eventId: string, data: any): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findOneAndUpdate(
      { _id: calendarId, 'events._id': eventId },
      { $set: { 'events.$': data } },
      { new: true }
    );
  }

  async deleteSharedEvent(calendarId: string, eventId: string): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findByIdAndUpdate(calendarId, { $pull: { events: { _id: eventId } } }, { new: true });
  }

  async shareCalendar(calendarId: string, userId: string): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findByIdAndUpdate(calendarId, { $addToSet: { sharedWith: userId } }, { new: true });
  }

  async unshareCalendar(calendarId: string, userId: string): Promise<SharedCalendar | null> {
    return this.sharedCalendarModel.findByIdAndUpdate(calendarId, { $pull: { sharedWith: userId } }, { new: true });
  }
}
