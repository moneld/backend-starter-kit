// src/common/logger/logger.config.ts
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Format pour la console avec couleurs
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('AppLogger', {
        prettyPrint: true,
        colors: true,
    })
);

export function setupLogger(app: INestApplication, configService: ConfigService): void {
    // Récupérer les options de configuration
    const logLevel = configService.get<string>('app.logLevel', 'info');
    const logToFile = configService.get<boolean>('app.logToFile', false);
    const logFilePath = configService.get<string>('app.logFilePath', 'logs/app-%DATE%.log');
    const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
    const appName = configService.get<string>('app.name', 'NestJS API');

    // Créer le dossier des logs s'il n'existe pas
    if (logToFile && logFilePath) {
        const logDir = path.dirname(logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    // Configuration de base des transports
    const transports: winston.transport[] = [
        // Console transport - toujours activé
        new winston.transports.Console({
            level: nodeEnv === 'production' ? 'info' : 'debug',
            format: consoleFormat,
        }),
    ];

    // Ajouter un transport pour les logs détaillés si nécessaire
    if (logToFile) {
        // Transport pour tous les logs (app-%DATE%.log)
        transports.push(
            new winston.transports.DailyRotateFile({
                filename: logFilePath,
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                level: logLevel,
                format: customFormat,
            })
        );

        // Transport spécifique pour les erreurs (error-%DATE%.log)
        transports.push(
            new winston.transports.DailyRotateFile({
                filename: logFilePath.replace('app', 'error'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '30d',
                level: 'error',
                format: customFormat,
            })
        );
    }

    // Créer la configuration Winston
    const winstonLogger = WinstonModule.createLogger({
        defaultMeta: {
            service: appName,
            environment: nodeEnv,
        },
        exitOnError: false,
        transports,
        // Log niveau de détail en fonction de l'environnement
        level: nodeEnv === 'production' ? 'info' : 'debug',
    });

    // Remplacer le logger par défaut de NestJS
    app.useLogger(winstonLogger);

    // Configurer les hooks de démarrage/fermeture pour les logs
    app.enableShutdownHooks();
}