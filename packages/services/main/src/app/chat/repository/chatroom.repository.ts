import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { ChatRoomEntity } from "../entities/chatroom.entity";

@Injectable()
export class ChatRoomRepository extends Repository<ChatRoomEntity> {
    constructor(private dataSource: DataSource) {
        super(ChatRoomEntity, dataSource.createEntityManager());
    }
}
