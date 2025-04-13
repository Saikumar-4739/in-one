import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { VideoEntity } from "../enitities/video.entity";

@Injectable()
export class VideoRepository extends Repository<VideoEntity> {
    constructor(private dataSource: DataSource) {
        super(VideoEntity, dataSource.createEntityManager());
    }
}
