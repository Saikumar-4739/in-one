import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';
import rateLimit from 'express-rate-limit';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    });

    const configService = app.get(ConfigService);

    // Enable CORS
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Disposition'],
      credentials: true,
      maxAge: 3600,
    });

    // Global Middlewares
    const reflector = app.get(Reflector);
    app.use(bodyParser.urlencoded({ limit: configService.get<string>('maxPayloadSize', '10mb'), extended: true }));
    app.use(bodyParser.json({ limit: configService.get<string>('maxPayloadSize', '10mb') }));
    app.useGlobalPipes(new ValidationPipe({ validationError: { target: false }, transform: true, forbidUnknownValues: false }));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    // Serve Static Files
    const uploadsPath = join(__dirname, '..', 'uploads');
    app.use('/uploads', express.static(uploadsPath, { maxAge: '1d', etag: true }));

    // Rate Limiting
    app.use(
      rateLimit({
        windowMs: configService.get<number>('RATE_LIMIT_WINDOW', 15 * 60 * 1000),
        max: configService.get<number>('RATE_LIMIT_MAX', 100),
        message: {
          status: 429,
          message: 'Too many requests from this IP, please try again later.',
        },
        headers: true,
      }),
    );

    // Swagger Setup
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

    // Start Server
    const port = process.env.PORT || configService.get<number>('PORT', 3005);
    await app.listen(port);

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

    logger.log(`🚀 Server running on: ${baseUrl}`);
    logger.log(`📖 API Documentation available at: ${baseUrl}/docs`);

  } catch (error) {
    logger.error('Failed to bootstrap the application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  Logger.error('Application bootstrap failed:', error);
  process.exit(1);
});
