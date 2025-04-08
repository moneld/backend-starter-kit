import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { User } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { transformUser, transformUserForAdmin, transformUserForSelf } from '../transformers/user.transformer';

@Injectable()
export class UserTransformInterceptor implements NestInterceptor {
    constructor(
        private readonly options: {
            isAdmin?: boolean;
            isSelf?: boolean;
        } = {},
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // Ne pas transformer les réponses non-utilisateur
                if (!data) return data;

                const { isAdmin, isSelf } = this.options;

                // Traiter les tableaux d'utilisateurs
                if (Array.isArray(data)) {
                    return data.map((item) => this.transformItem(item, isAdmin, isSelf));
                }

                // Traiter un seul utilisateur
                return this.transformItem(data, isAdmin, isSelf);
            }),
        );
    }

    private transformItem(item: any, isAdmin?: boolean, isSelf?: boolean): any {
        // Vérifier si l'objet est un utilisateur
        if (!item || typeof item !== 'object') return item;

        // Traiter les objets de pagination
        if (item.data && Array.isArray(item.data) && item.meta) {
            return {
                ...item,
                data: item.data.map((user: any) => this.transformUser(user, isAdmin, isSelf)),
            };
        }

        return this.transformUser(item, isAdmin, isSelf);
    }

    private transformUser(user: any, isAdmin?: boolean, isSelf?: boolean): any {
        // Vérifier si l'objet est un utilisateur
        if (!user || !user.email || typeof user.email !== 'string') {
            return user;
        }

        if (isAdmin) {
            return transformUserForAdmin(user as User);
        }

        if (isSelf) {
            return transformUserForSelf(user as User);
        }

        return transformUser(user as User);
    }
}