import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { NoteEntity } from "../entities/notes.entity";

@Injectable()
export class NotesRepository extends Repository<NoteEntity> {
    constructor(private dataSource: DataSource) {
        super(NoteEntity, dataSource.createEntityManager());
    }
}