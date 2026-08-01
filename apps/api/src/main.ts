import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateProductionConfig } from './common/production-config';

async function bootstrap(): Promise<void> {
  validateProductionConfig();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') || 'http://localhost:3001',
    exposedHeaders: ['X-Guest-Key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port);
  logger.log(`API listening on port ${port} (prefix /${prefix})`);
}

void bootstrap();
