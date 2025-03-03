import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { CalendarEntity } from "../entities/calender.entity";

@Injectable()
export class CalenderRepository extends Repository<CalendarEntity> {
    constructor(private dataSource: DataSource) {
        super(CalendarEntity, dataSource.createEntityManager());
    }
}