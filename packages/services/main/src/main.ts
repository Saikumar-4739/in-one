import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    });

    // Get configuration service
    const configService = app.get(ConfigService);

    // CORS Configuration
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Disposition'],
      credentials: true,
      maxAge: 3600,
    });

    // Global Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Static Files Serving
    const uploadsPath = join(__dirname, '..', 'uploads');
    app.use('/uploads', express.static(uploadsPath, {
      maxAge: '1d',
      etag: true,
    }));

    // Rate Limiting Configuration
    app.use(rateLimit({
      windowMs: configService.get<number>('RATE_LIMIT_WINDOW', 15 * 60 * 1000),
      max: configService.get<number>('RATE_LIMIT_MAX', 100),
      message: {
        status: 429,
        message: 'Too many requests from this IP, please try again later.',
      },
      headers: true,
    }));

    // Swagger Configuration
    const swaggerConfig = new DocumentBuilder()
      .setTitle('In One API')
      .setDescription('API Documentation for In One App')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // Use Render-provided PORT or fallback to 3000 for local development
    const port = parseInt(process.env.PORT || configService.get<string>('PORT', '3000'), 10);

    // Start the server
    await app.listen(port);

    logger.log(`🚀 Server running on port: ${port}`);
    logger.log(`📖 API Documentation available at: /docs`);

  } catch (error) {
    logger.error('Failed to bootstrap the application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  Logger.error('Application bootstrap failed:', error);
  process.exit(1);
});