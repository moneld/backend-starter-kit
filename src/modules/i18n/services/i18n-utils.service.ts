import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class I18nUtilsService {
    constructor(
        private readonly i18nService: I18nService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Récupère la langue de l'utilisateur à partir de la requête
     */
    getLangFromRequest(request: FastifyRequest): string {
        const acceptLang = request.headers['accept-language'];
        const customLang = request.headers['x-custom-lang'];
        const defaultLang = this.configService.get<string>('app.defaultLanguage', 'fr');

        return this.normalizeLangHeader(acceptLang) ||
            this.normalizeLangHeader(customLang) ||
            defaultLang;
    }

    /**
     * Normalise un header de langue qui peut être string ou string[]
     * Renvoie la première langue ou undefined
     */
    private normalizeLangHeader(header: string | string[] | undefined): string | undefined {
        if (!header) return undefined;
        if (Array.isArray(header)) return header[0];
        return header;
    }

    /**
     * Traduit un message avec des paramètres
     */
    translate(key: string, args?: Record<string, any>, lang?: string): string {
        try {
            return this.i18nService.translate(key, {
                lang: lang || this.configService.get<string>('app.defaultLanguage', 'fr'),
                args,
            });
        } catch (error) {
            return key; // Retourne la clé si la traduction n'est pas trouvée
        }
    }

    /**
     * Traduit un message avec des paramètres dans toutes les langues supportées
     */
    translateToAllLanguages(key: string, args?: Record<string, any>): Record<string, string> {
        const supportedLanguages = this.configService.get<string[]>('app.supportedLanguages', ['fr', 'en']);
        const translations: Record<string, string> = {};

        supportedLanguages.forEach((lang) => {
            translations[lang] = this.translate(key, args, lang);
        });

        return translations;
    }

    /**
     * Formate un message avec des variables
     * Exemple: format("Hello {name}", { name: "John" }) => "Hello John"
     */
    format(message: string, vars: Record<string, any>): string {
        return message.replace(/{([^{}]*)}/g, (match, key) => {
            const value = vars[key];
            return typeof value !== 'undefined' ? value : match;
        });
    }
}