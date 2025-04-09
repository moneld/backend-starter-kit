// src/common/swagger/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  if (configService.get('app.enableSwagger', true)) {
    const appName = configService.get('app.name', 'NestJS API');
    const appVersion = configService.get('app.apiVersion', '1.0');
    const apiPrefix = configService.get('app.apiPrefix', 'api');

    // Récupérer les informations du package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let packageInfo: any = {
      version: '1.0.0',
      description: 'API Documentation',
    };

    if (fs.existsSync(packageJsonPath)) {
      try {
        packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (e) {
        console.warn('Could not parse package.json for Swagger documentation');
      }
    }

    const config = new DocumentBuilder()
      .setTitle(`${appName} API`)
      .setDescription(packageInfo.description || 'API Documentation')
      .setVersion(packageInfo.version || appVersion)
      .setContact(
        'Support',
        configService.get('app.supportUrl', ''),
        configService.get('app.supportEmail', ''),
      )
      .setLicense(
        packageInfo.license || 'License',
        configService.get('app.licenseUrl', ''),
      )
      .setTermsOfService(configService.get('app.termsOfServiceUrl', ''))
      .setExternalDoc(
        'Documentation',
        configService.get('app.externalDocUrl', ''),
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'API Key for external services',
        },
        'api-key',
      )
      .addTag('Authentication', 'Authentication and authorization operations')
      .addTag('Users', 'User management operations')
      .addTag('Roles', 'Role management operations')
      .addTag('Permissions', 'Permission management operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Options de l'interface Swagger
    const options = {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        deepLinking: true,
      },
      customSiteTitle: `${appName} API Documentation`,
      customCss: '.swagger-ui .topbar { display: none }', // Cacher la barre Swagger par défaut
    };

    // Si nécessaire, sauvegarder la spécification OpenAPI en JSON
    if (configService.get('app.saveSwaggerJson', false)) {
      const outputPath = configService.get(
        'app.swaggerJsonPath',
        'swagger-spec.json',
      );
      fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    }

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, options);

    console.log(`Swagger documentation is available at /${apiPrefix}/docs`);
  } else {
    console.log('Swagger documentation is disabled');
  }
}
