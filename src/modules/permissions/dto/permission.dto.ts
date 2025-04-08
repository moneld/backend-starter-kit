import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Définition d'un DTO minimal pour le rôle (évite la référence circulaire)
export class RoleMinimalDto {
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
}

export class CreatePermissionDto {
    @ApiProperty({
        description: 'Le nom de la permission (format resource:action)',
        example: 'articles:create',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'La description de la permission',
        example: 'Permet de créer des articles',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdatePermissionDto {
    @ApiProperty({
        description: 'Le nouveau nom de la permission (format resource:action)',
        example: 'articles:write',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'La nouvelle description de la permission',
        example: 'Permet d\'écrire et modifier des articles',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;
}

export class PermissionResponseDto {
    @ApiProperty({
        description: 'L\'identifiant unique de la permission',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Le nom de la permission',
        example: 'articles:create',
    })
    name: string;

    @ApiProperty({
        description: 'La description de la permission',
        example: 'Permet de créer des articles',
    })
    description?: string;

    @ApiProperty({
        description: 'Date de création de la permission',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Date de dernière mise à jour de la permission',
        example: '2023-01-01T00:00:00.000Z',
    })
    updatedAt: Date;
}

export class PermissionWithRolesDto extends PermissionResponseDto {
    @ApiProperty({
        description: 'Les rôles qui ont cette permission',
        type: [RoleMinimalDto],
    })
    roles?: RoleMinimalDto[];
}