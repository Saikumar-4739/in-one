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

  // ✅ Improved CORS Handling
  app.enableCors({
    origin: '*', 
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Content-Disposition',
    credentials: true,
  });

  // ✅ Properly Serve Static Images
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // ✅ Optional Rate Limiting (increase the max limit)
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
    message: 'Too many requests, please try again later.',
  }));

  // ✅ Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('In One API')
    .setDescription('API Documentation for In One App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port: number = parseInt(process.env.PORT || '3005', 10);
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Server is running on http://localhost:${port}`);
  logger.log(`📜 Swagger API Docs available at http://localhost:${port}/docs`);
}

bootstrap();