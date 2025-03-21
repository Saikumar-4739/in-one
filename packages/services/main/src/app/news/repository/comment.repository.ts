import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { NewsCommentEntity } from "../entities/comment.entity";

@Injectable()
export class CommentRepository extends Repository<NewsCommentEntity> {
    constructor(private dataSource: DataSource) {
        super(NewsCommentEntity, dataSource.createEntityManager());
    }
}