import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    AcceptLanguageResolver,
    CookieResolver,
    HeaderResolver,
    I18nJsonLoader,
    I18nModule as NestI18nModule,
    QueryResolver
} from 'nestjs-i18n';
import * as path from 'path';
import { I18nExceptionFilter } from './filters/i18n-exception.filter';
import { I18nResponseInterceptor } from './interceptors/i18n-response.interceptor';
import { I18nUtilsService } from './services/i18n-utils.service';

@Module({
    imports: [
        NestI18nModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                // Détermine si on est en mode production ou développement
                const isProduction = configService.get('app.nodeEnv') === 'production';

                // Chemin vers les fichiers de traduction
                // En prod: cherche dans dist/i18n
                // En dev: cherche dans src/i18n
                const i18nPath = isProduction
                    ? path.join(process.cwd(), 'dist/i18n')
                    : path.join(process.cwd(), 'src/i18n');

                return {
                    fallbackLanguage: configService.get('app.defaultLanguage', 'fr'),
                    loaderOptions: {
                        path: i18nPath,
                        watch: configService.get('app.nodeEnv') === 'development',
                    },
                };
            },
            loader: I18nJsonLoader,
            resolvers: [
                { use: QueryResolver, options: ['lang', 'locale', 'l'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-custom-lang']),
                new CookieResolver(['lang', 'locale', 'l']),
            ],
            inject: [ConfigService],
        }),
    ],
    providers: [I18nUtilsService, I18nExceptionFilter, I18nResponseInterceptor],
    exports: [NestI18nModule, I18nUtilsService, I18nExceptionFilter, I18nResponseInterceptor],
})
export class I18nModule { }