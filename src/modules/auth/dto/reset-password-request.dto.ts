import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email non valide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
}
