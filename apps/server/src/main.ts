import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get('CLIENT_URL'),
    credentials: true,
  });

  app.setGlobalPrefix(`api/${config.get('APP_VERSION')}`);

  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
