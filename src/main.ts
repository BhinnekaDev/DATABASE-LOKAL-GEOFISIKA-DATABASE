import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('API END POINT')
    .setDescription('Dokumentasi API Lokal Database Geofisika')
    .setVersion('1.0')
    .addTag('Autentikasi')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    customSiteTitle: '⚡ Dokumentasi API Geofisika',
    customCss: `
        .swagger-ui .topbar {
            display: none;
        }

        ::-webkit-scrollbar {
            width: 10px;
        }

        ::-webkit-scrollbar-track {
            background:rgb(255, 255, 255);
            border-radius: 8px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #1abc9c, #00bcd4);
            border-radius: 8px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #16a085, #0097a7);
        }
        `,
    customfavIcon: 'https://img.icons8.com/fluency/48/api.png',
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
