import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { ReelEntity } from "../entities/reel.entity";

@Injectable()
export class ReelsRepository extends Repository<ReelEntity> {
    constructor(private dataSource: DataSource) {
        super(ReelEntity, dataSource.createEntityManager());
    }
}