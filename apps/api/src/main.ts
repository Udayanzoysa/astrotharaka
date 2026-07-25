import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

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
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/${prefix}`);
}

void bootstrap();
