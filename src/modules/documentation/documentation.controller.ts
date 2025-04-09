// src/modules/documentation/documentation.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentationService } from './documentation.service';

@ApiTags('Documentation')
@Controller({ path: 'api-info', version: '1' })
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Obtenir les informations de l'API" })
  @ApiResponse({
    status: 200,
    description: "Informations de l'API récupérées avec succès",
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string' },
        environment: { type: 'string' },
        contact: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            url: { type: 'string' },
          },
        },
        license: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            url: { type: 'string' },
          },
        },
        endpoints: {
          type: 'object',
          properties: {
            api: { type: 'string' },
            docs: { type: 'string' },
            health: { type: 'string' },
          },
        },
      },
    },
  })
  getApiInfo() {
    return this.documentationService.getApiInfo();
  }

  @Public()
  @Get('versions')
  @ApiOperation({ summary: "Obtenir les versions supportées de l'API" })
  @ApiResponse({
    status: 200,
    description: "Versions de l'API récupérées avec succès",
    schema: {
      type: 'object',
      properties: {
        current: { type: 'string' },
        supported: {
          type: 'array',
          items: { type: 'string' },
        },
        deprecated: {
          type: 'array',
          items: { type: 'string' },
        },
        versioningType: { type: 'string' },
        versionPrefix: { type: 'string' },
      },
    },
  })
  getApiVersions() {
    return this.documentationService.getApiVersions();
  }
}
