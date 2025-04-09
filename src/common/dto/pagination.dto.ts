import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class PaginationDto {
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
        description: "Nombre d'éléments par page",
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
        description: 'Ordre de tri',
        required: false,
        default: SortOrder.DESC,
        enum: SortOrder,
    })
    @IsOptional()
    @IsEnum(SortOrder, {
        message: 'L\'ordre de tri doit être "asc" ou "desc"',
    })
    sortOrder?: SortOrder = SortOrder.DESC;
}