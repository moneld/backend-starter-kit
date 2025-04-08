import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export enum UserSortField {
    ID = 'id',
    EMAIL = 'email',
    FIRST_NAME = 'firstName',
    LAST_NAME = 'lastName',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class QueryUserDto {
    @ApiProperty({
        description: 'Page à récupérer (commence à 1)',
        required: false,
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La page doit être un nombre entier' })
    @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
    page?: number = 1;

    @ApiProperty({
        description: 'Nombre d\'éléments par page',
        required: false,
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La limite doit être un nombre entier' })
    @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
    limit?: number = 10;

    @ApiProperty({
        description: 'Recherche par email',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email non valide' })
    email?: string;

    @ApiProperty({
        description: 'Recherche par prénom',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
    firstName?: string;

    @ApiProperty({
        description: 'Recherche par nom',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    lastName?: string;

    @ApiProperty({
        description: 'Filtrer par statut d\'activation',
        required: false,
        enum: ['true', 'false'],
    })
    @IsOptional()
    @IsString()
    @IsBoolean({ message: 'Le statut d\'activation doit être un booléen' })
    isActive?: boolean;

    @ApiProperty({
        description: 'Filtrer par statut de vérification',
        required: false,
        enum: ['true', 'false'],
    })
    @IsOptional()
    @IsString()
    @IsBoolean({ message: 'Le statut de vérification doit être un booléen' })
    isVerified?: boolean;

    @ApiProperty({
        description: 'Champ de tri',
        required: false,
        default: UserSortField.CREATED_AT,
        enum: UserSortField,
    })
    @IsOptional()
    @IsEnum(UserSortField, { message: 'Champ de tri non valide' })
    sortBy?: UserSortField = UserSortField.CREATED_AT;

    @ApiProperty({
        description: 'Ordre de tri',
        required: false,
        default: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsEnum(['asc', 'desc'], { message: 'L\'ordre de tri doit être "asc" ou "desc"' })
    sortOrder?: 'asc' | 'desc' = 'desc';

    @ApiProperty({
        description: 'Filtrer par rôle (ID du rôle)',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'L\'ID du rôle doit être une chaîne de caractères' })
    roleId?: string;
}