import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './entities/notes.entity';
import { NotesService } from './notes.service';
import { NotesCalenderController } from './notes.controller';
import { NotesRepository } from './repository/notes.repository';
import { UserEntity } from '../user/entities/user.entity';
import { UserRepository } from '../user/repository/user.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NoteEntity,
      UserEntity,
    ]),
  ],
  providers: [
    NotesService,
    NotesRepository,
    GenericTransactionManager,
  ],
  controllers: [NotesCalenderController],
})
export class NotesModule { }
