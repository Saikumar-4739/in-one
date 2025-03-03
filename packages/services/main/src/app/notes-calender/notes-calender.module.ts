import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './entities/notes.entity';
import { NotesService } from './notes.service';
import { NotesCalenderController } from './notes-calender.controller';
import { CalendarEntity } from './entities/calender.entity';
import { NotesRepository } from './repository/notes.repository';
import { CalenderRepository } from './repository/calender.repository';
import { CalenderEventRepository } from './repository/calenderevent.repository';
import { UserEntity } from '../authentication/entities/user.entity';
import { UserRepository } from '../authentication/repository/user.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CalendarEventEntity } from './entities/calender.event.entity';
import { CalendarService } from './calender.service';


@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity, CalendarEntity, UserEntity, CalendarEventEntity])],
  providers: [NotesService, NotesRepository, CalenderRepository, CalenderEventRepository, UserRepository, GenericTransactionManager, CalendarService],
  controllers: [NotesCalenderController],
})
export class NotesCalendarModule {}
