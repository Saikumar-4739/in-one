import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { StoryEntity } from "../entities/story.entity";

@Injectable()
export class StoriesRepository extends Repository<StoryEntity> {
    constructor(private dataSource: DataSource) {
        super(StoryEntity, dataSource.createEntityManager());
    }
}