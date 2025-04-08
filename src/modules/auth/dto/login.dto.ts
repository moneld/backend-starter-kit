import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email non valide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'P@ssw0rd',
  })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  password: string;
}
