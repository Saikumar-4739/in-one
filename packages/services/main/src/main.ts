import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('In One API')
    .setDescription('API Documentation for In One App')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = 3005;
  await app.listen(port);

  logger.log(`🚀 Server is running on http://localhost:${port}`);
  logger.log(`📜 Swagger API Docs available at http://localhost:${port}/docs`);
}
bootstrap();
