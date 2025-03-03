import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { CommonResponse, CreateCalendarEventModel, CreateCalendarModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CalenderRepository } from './repository/calender.repository';
import { CalenderEventRepository } from './repository/calenderevent.repository';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalenderRepository)
    private readonly calendarRepository: CalenderRepository,
    @InjectRepository(CalenderEventRepository)
    private readonly calendarEventRepository: CalenderEventRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly transactionManager: GenericTransactionManager, 
  ) {}

  async create( createCalendarDto: CreateCalendarModel, createEventDto: CreateCalendarEventModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const calendarRepo = this.transactionManager.getRepository(this.calendarRepository);
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);
     const user = await userRepo.findOne({
      where: { id: createCalendarDto.userId },
    });
     if (!user) {
       throw new Error('User not found');
     }
     const newCalendar = calendarRepo.create({
       user: user, 
     });
     const savedCalendar = await calendarRepo.save(newCalendar);
     createEventDto.calendarId = savedCalendar.id;  
     const newEvent = eventRepo.create(createEventDto);
     const savedEvent = await eventRepo.save(newEvent);
     await this.transactionManager.commitTransaction();
     return new CommonResponse(true, 200, 'Calendar and Event created successfully', {
       calendar: savedCalendar,
       event: savedEvent,
     });
   } catch (error) {
     await this.transactionManager.rollbackTransaction();
     console.error('❌ Error creating calendar and event:', error);
     return new CommonResponse(false, 500, 'Error creating calendar and event', error);
   }
  }

  async getAllCalendars(userId: string): Promise<CommonResponse> {
    try {
      const calendars = await this.calendarRepository.find({
        where: { user: { id: userId } },
        relations: ['events'],
      });
      return new CommonResponse(true, 200, 'Calendars retrieved successfully', calendars);
    } catch (error) {
      console.error('❌ Error retrieving calendars:', error);
      return new CommonResponse(false, 500, 'Error retrieving calendars', error);
    }
  }

  async getCalendarById(id: string): Promise<CommonResponse> {
    try {
      const calendar = await this.calendarRepository.findOne({
        where: { id },
        relations: ['events'],
      });

      if (!calendar) {
        return new CommonResponse(false, 404, 'Calendar not found', null);
      }

      return new CommonResponse(true, 200, 'Calendar retrieved successfully', calendar);
    } catch (error) {
      console.error('❌ Error retrieving calendar:', error);
      return new CommonResponse(false, 500, 'Error retrieving calendar', error);
    }
  }

  async delete(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const calendarRepo = this.transactionManager.getRepository(this.calendarRepository);
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const calendar = await calendarRepo.findOne({ where: { id } });

      if (!calendar) {
        return new CommonResponse(false, 404, 'Calendar not found', null);
      }
      await eventRepo.delete({ calendar: { id } });
      await calendarRepo.remove(calendar);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Calendar and associated events deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting calendar and events:', error);
      return new CommonResponse(false, 500, 'Error deleting calendar and events', error);
    }
  }

  async addEvent(calendarId: string, eventDto: any): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const calendarRepo = this.transactionManager.getRepository(this.calendarRepository);
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const calendar = await calendarRepo.findOne({
        where: { id: calendarId },
        relations: ['events'],
      });
      if (!calendar) {
        return new CommonResponse(false, 404, 'Calendar not found', null);
      }
      const newEvent = eventRepo.create({
        ...eventDto,
        calendar,
      });
      const savedEvent = await eventRepo.save(newEvent);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Event added successfully', savedEvent);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error adding event:', error);
      return new CommonResponse(false, 500, 'Error adding event', error);
    }
  }

  async updateEvent(id: string, eventDto: any): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const existingEvent = await eventRepo.findOne({ where: { id } });
      if (!existingEvent) {
        return new CommonResponse(false, 404, 'Event not found', null);
      }
      const updatedEvent = Object.assign(existingEvent, eventDto);
      const savedEvent = await eventRepo.save(updatedEvent);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Event updated successfully', savedEvent);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating event:', error);
      return new CommonResponse(false, 500, 'Error updating event', error);
    }
  }

  async deleteEvent(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const eventRepo = this.transactionManager.getRepository(this.calendarEventRepository);
      const event = await eventRepo.findOne({ where: { id } });
      if (!event) {
        return new CommonResponse(false, 404, 'Event not found', null);
      }
      await eventRepo.remove(event);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Event deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting event:', error);
      return new CommonResponse(false, 500, 'Error deleting event', error);
    }
  }
}
