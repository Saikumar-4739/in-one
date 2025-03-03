import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { CallEntity } from "../entities/call.entity";

@Injectable()
export class CallRepository extends Repository<CallEntity> {
    constructor(private dataSource: DataSource) {
        super(CallEntity, dataSource.createEntityManager());
    }
}