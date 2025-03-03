import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "../entities/comment.entity";

@Injectable()
export class CommentRepository extends Repository<CommentEntity> {
    constructor(private dataSource: DataSource) {
        super(CommentEntity, dataSource.createEntityManager());
    }
}