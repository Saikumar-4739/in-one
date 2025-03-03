import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { MessageEntity } from "../entities/messege.entity";

@Injectable()
export class MessegeRepository extends Repository<MessageEntity> {
    constructor(private dataSource: DataSource) {
        super(MessageEntity, dataSource.createEntityManager());
    }
}