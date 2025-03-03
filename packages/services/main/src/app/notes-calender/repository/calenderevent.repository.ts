import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { CalendarEventEntity } from "../entities/calender.event.entity";

@Injectable()
export class CalenderEventRepository extends Repository<CalendarEventEntity> {
    constructor(private dataSource: DataSource) {
        super(CalendarEventEntity, dataSource.createEntityManager());
    }
}