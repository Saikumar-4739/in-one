import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './authentication/user.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from 'src/database/database.module';
import { NotesCalendarModule } from './notes-calender/notes-calender.module';
import { NewsModule } from './news/news.module';
import { VideoModule } from './entertainment/video/video.module';
import { PhotoModule } from './entertainment/photo/photo.module';
import { ReelModule } from './entertainment/reels/reels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../env', 
    }),
    DatabaseModule,
    UserModule,
    ChatModule,
    NotesCalendarModule,
    NewsModule,
    VideoModule,
    PhotoModule,
    ReelModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
