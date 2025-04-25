import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './entities/notes.entity';
import { NotesService } from './notes.service';
import { NotesCalenderController } from './notes.controller';
import { NotesRepository } from './repository/notes.repository';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([ NoteEntity, UserEntity])],
  providers: [ NotesService, NotesRepository],
  controllers: [NotesCalenderController]
})
export class NotesModule { }
