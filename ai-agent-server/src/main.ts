import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({
    origin: 'http://localhost:3000', // порт Next.js
    methods: ['GET', 'POST'],
  });
  await app.listen(process.env.PORT ?? 4000);

  const port = process.env.PORT ?? 4000;
  const columns = process.stdout.columns || 80;
  const msg = `Server is running on port \x1b[32m${port}\x1b[0m`;
  const separator = '-'.repeat(columns);
  console.log(separator);
  console.log(msg.padStart(Math.floor((columns + msg.length) / 2)));
  console.log(separator);
}
void bootstrap();
// Use ANSI codes: regular message, highlight port in green
