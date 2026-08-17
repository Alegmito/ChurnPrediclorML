import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;

  await app.listen(port);

  Logger.log(`NestJS API is running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
