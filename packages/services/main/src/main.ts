import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: '*', 
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Content-Disposition',
    credentials: true,
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, 
    message: 'Too many requests, please try again later.',
  }));

  const config = new DocumentBuilder()
    .setTitle('In One API')
    .setDescription('API Documentation for In One App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3005; // Use Render's PORT
  await app.listen(port, '0.0.0.0'); // Bind to all network interfaces

  logger.log(`🚀 Server is running on http://localhost:${port}`);
  logger.log(`📜 Swagger API Docs available at http://localhost:${port}/docs`);
}  

bootstrap();
