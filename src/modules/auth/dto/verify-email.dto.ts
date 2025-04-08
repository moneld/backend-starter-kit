import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: "Token de vérification d'email",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Token requis' })
  @IsString({ message: 'Le token doit être une chaîne de caractères' })
  token: string;
}
