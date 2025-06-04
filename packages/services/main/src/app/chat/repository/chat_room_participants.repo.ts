import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { ChatRoomParticipantEntity } from "../entities/chat.room.participants";

@Injectable()
export class ChatRoomParticipantRepository extends Repository<ChatRoomParticipantEntity> {
    constructor(private dataSource: DataSource) {
        super(ChatRoomParticipantEntity, dataSource.createEntityManager());
    }
}