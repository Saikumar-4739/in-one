import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './authentication/user.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from 'src/database/database.module';
import { NewsModule } from './news/news.module';
import { VideoModule } from './entertainment/video/video.module';
import { PhotoModule } from './entertainment/photo/photo.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { LoggerMiddleware } from './authentication/logger.middleware';
import { StoriesModule } from './stories/story.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../env', 
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '7d' },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, 
          limit: 10, 
        },
      ],
    }),
    DatabaseModule,
    UserModule,
    ChatModule,
    NewsModule,
    VideoModule,
    PhotoModule,
    StoriesModule,
    NotesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
