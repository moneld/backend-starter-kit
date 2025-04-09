import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum UserSortField {
  ID = 'id',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class QueryUserDto extends PaginationDto {
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
    description: "Filtrer par statut d'activation",
    required: false,
    enum: ['true', 'false'],
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Le statut d'activation doit être un booléen" })
  isActive?: boolean;

  @ApiProperty({
    description: 'Filtrer par statut de vérification',
    required: false,
    enum: ['true', 'false'],
  })
  @IsOptional()
  @Type(() => Boolean)
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
    description: 'Filtrer par rôle (ID du rôle)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'ID du rôle doit être une chaîne de caractères" })
  roleId?: string;
}