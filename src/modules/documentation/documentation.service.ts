// src/modules/documentation/documentation.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentationService {
    constructor(private configService: ConfigService) { }

    /**
     * Récupère les informations de l'API
     */
    getApiInfo() {
        // Récupérer les informations du package.json
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let packageInfo: any = { version: '1.0.0', description: 'API Documentation' };

        if (fs.existsSync(packageJsonPath)) {
            try {
                packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            } catch (e) {
                console.warn('Could not parse package.json for API info');
            }
        }

        return {
            name: this.configService.get('app.name', 'NestJS API'),
            version: packageInfo.version || this.configService.get('app.apiVersion', '1.0'),
            description: packageInfo.description || 'API Documentation',
            environment: this.configService.get('app.nodeEnv', 'development'),
            contact: {
                name: this.configService.get('app.supportName', 'Support'),
                email: this.configService.get('app.supportEmail', ''),
                url: this.configService.get('app.supportUrl', ''),
            },
            license: {
                name: packageInfo.license || 'License',
                url: this.configService.get('app.licenseUrl', ''),
            },
            endpoints: {
                api: `${this.configService.get('app.url', '')}/${this.configService.get('app.apiPrefix', 'api')}`,
                docs: `${this.configService.get('app.url', '')}/${this.configService.get('app.apiPrefix', 'api')}/docs`,
                health: `${this.configService.get('app.url', '')}/${this.configService.get('app.apiPrefix', 'api')}/health`,
            }
        };
    }

    /**
     * Récupère les versions supportées de l'API
     */
    getApiVersions() {
        const currentVersion = this.configService.get('app.apiVersion', '1');
        const deprecatedVersions = this.configService.get('app.deprecatedVersions', []);
        const supportedVersions = this.configService.get('app.supportedVersions', [currentVersion]);

        return {
            current: currentVersion,
            supported: supportedVersions,
            deprecated: deprecatedVersions,
            versioningType: 'URI', // URI, HEADER, MEDIA_TYPE
            versionPrefix: 'v',
        };
    }
}