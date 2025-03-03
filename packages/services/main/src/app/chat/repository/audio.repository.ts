import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { AudioMessageEntity } from "../entities/audio.entity";

@Injectable()
export class AudioRepository extends Repository<AudioMessageEntity> {
    constructor(private dataSource: DataSource) {
        super(AudioMessageEntity, dataSource.createEntityManager());
    }
}