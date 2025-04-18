import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'new-email@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email non valide' })
  email?: string;

  @ApiProperty({
    description: "Nouveau mot de passe de l'utilisateur",
    example: 'NewComplexP@ssw0rd123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial',
  })
  password?: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  firstName?: string;

  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  lastName?: string;

  @ApiProperty({
    description: "Statut d'activation de l'utilisateur",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Le statut d'activation doit être un booléen" })
  isActive?: boolean;

  @ApiProperty({
    description: "Statut de vérification de l'utilisateur",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut de vérification doit être un booléen' })
  isVerified?: boolean;

  @ApiProperty({
    description: "Identifiants des rôles à attribuer à l'utilisateur",
    example: ['role-id-1', 'role-id-2'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Les rôles doivent être un tableau' })
  @IsString({
    each: true,
    message: 'Chaque identifiant de rôle doit être une chaîne de caractères',
  })
  roleIds?: string[];
}
