  import { NestFactory, Reflector } from '@nestjs/core';
  import { AppModule } from './app/app.module';
  import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
  import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import rateLimit from 'express-rate-limit';
  import * as bodyParser from 'body-parser';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({ credentials: true, origin: true });

    const reflector = app.get(Reflector);
    const configService = app.get(ConfigService);

    app.use(bodyParser.urlencoded({ limit: configService.get('maxPayloadSize'), extended: true }));
    app.use(bodyParser.json({ limit: configService.get('maxPayloadSize') }));
    app.useGlobalPipes(
      new ValidationPipe({ 
        validationError: { target: false }, 
        transform: true, 
        forbidUnknownValues: false 
      })
    );
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

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

    const port = parseInt(process.env.PORT ?? '3005', 10);
    await app.listen(port, '0.0.0.0');

    Logger.log(`🚀 INO service running on http://0.0.0.0:${port}`);
  }

  bootstrap();
