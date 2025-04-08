import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { WinstonModule } from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('app.logLevel');
        const logToFile = configService.get<boolean>('app.logToFile');
        const logFilePath = configService.get<string>('app.logFilePath');
        const nodeEnv = configService.get<string>('app.nodeEnv');

        // Créer le dossier des logs s'il n'existe pas
        if (logToFile && logFilePath) {
          const logDir = path.dirname(logFilePath);
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
        }

        // Configuration de base des transports
        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              nodeEnv === 'development'
                ? winston.format.colorize()
                : winston.format.uncolorize(),
              winston.format.printf(
                ({ timestamp, level, message, context }) => {
                  return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                },
              ),
            ),
          }),
        ];

        // Ajouter le transport de fichier si nécessaire
        if (logToFile && logFilePath) {
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: path.join(
                path.dirname(logFilePath),
                path.basename(logFilePath, path.extname(logFilePath)) +
                  '-%DATE%' +
                  path.extname(logFilePath),
              ),
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          );
        }

        return {
          level: logLevel,
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
