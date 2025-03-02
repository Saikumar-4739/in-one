import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { CalendarController } from './calender.controller';
import { CalendarService } from './calender.service';
import { Calendar, CalendarSchema } from './schema/calender.schema';
import { Note, NoteSchema } from './schema/notes.schema';
import { Reminder, ReminderSchema } from './schema/remainder.schema';
import { SharedCalendar, SharedCalendarSchema } from './schema/shared.calender.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: Reminder.name, schema: ReminderSchema },
      { name: SharedCalendar.name, schema: SharedCalendarSchema },
    ]),
  ],
  controllers: [NotesController, CalendarController],
  providers: [NotesService, CalendarService],
})
export class NotesCalendarModule {}
