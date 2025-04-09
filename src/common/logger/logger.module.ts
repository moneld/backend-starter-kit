
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { WinstonModule } from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('app.logLevel', 'info');
        const logToFile = configService.get<boolean>('app.logToFile', false);
        const logFilePath = configService.get<string>('app.logFilePath', 'logs/app-%DATE%.log');
        const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

        // Créer le dossier des logs s'il n'existe pas
        if (logToFile && logFilePath) {
          const logDir = path.dirname(logFilePath);
          try {
            if (!fs.existsSync(logDir)) {
              fs.mkdirSync(logDir, { recursive: true });
              console.log(`Log directory created: ${logDir}`);
            }
          } catch (error) {
            console.error(`Failed to create log directory: ${error.message}`);
          }
        }

        // Configuration des transports
        const transports: winston.transport[] = [
          // Console transport
          new winston.transports.Console({
            level: nodeEnv === 'development' ? 'debug' : 'info',
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

        // Transport de fichier si activé
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
              level: logLevel,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          );

          // Transport spécifique pour les erreurs
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: path.join(
                path.dirname(logFilePath),
                path.basename(logFilePath, path.extname(logFilePath)) +
                '-error-%DATE%' +
                path.extname(logFilePath),
              ),
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          );

          console.log(`File logging enabled. Logs will be written to: ${logFilePath}`);
        }

        return {
          level: nodeEnv === 'production' ? 'info' : 'debug',
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule { }