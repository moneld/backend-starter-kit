import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

// Définition d'un DTO minimal pour la permission (évite la référence circulaire)
export class PermissionDto {
    @ApiProperty({
        description: 'L\'identifiant unique de la permission',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Le nom de la permission',
        example: 'create:article',
    })
    name: string;

    @ApiProperty({
        description: 'La description de la permission',
        example: 'Peut créer des articles',
    })
    description?: string;
}

export class CreateRoleDto {
    @ApiProperty({
        description: 'Le nom du rôle',
        example: 'editor',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'La description du rôle',
        example: 'Peut modifier le contenu mais pas la configuration',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Les identifiants des permissions à attribuer à ce rôle',
        example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    permissionIds?: string[];
}

export class UpdateRoleDto {
    @ApiProperty({
        description: 'Le nouveau nom du rôle',
        example: 'content-editor',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'La nouvelle description du rôle',
        example: 'Peut éditer le contenu du site',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Les identifiants des permissions à attribuer à ce rôle (remplace les permissions existantes)',
        example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    permissionIds?: string[];
}

export class RoleResponseDto {
    @ApiProperty({
        description: 'L\'identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Le nom du rôle',
        example: 'editor',
    })
    name: string;

    @ApiProperty({
        description: 'La description du rôle',
        example: 'Peut modifier le contenu mais pas la configuration',
    })
    description?: string;

    @ApiProperty({
        description: 'Date de création du rôle',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Date de dernière mise à jour du rôle',
        example: '2023-01-01T00:00:00.000Z',
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Les permissions associées à ce rôle',
        type: [PermissionDto],
        required: false,
    })
    permissions?: PermissionDto[];
}

export class RoleWithUsersDto extends RoleResponseDto {
    @ApiProperty({
        description: 'Le nombre d\'utilisateurs ayant ce rôle',
        example: 5,
    })
    userCount: number;
}