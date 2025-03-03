import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { NewsEntity } from "../entities/news.entity";

@Injectable()
export class NewsRepository extends Repository<NewsEntity> {
    constructor(private dataSource: DataSource) {
        super(NewsEntity, dataSource.createEntityManager());
    }
}