import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorAuthDto {
  @ApiProperty({
    description: "Code d'authentification à deux facteurs",
    example: '123456',
  })
  @IsNotEmpty({ message: 'Code requis' })
  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @Length(6, 6, { message: 'Le code doit contenir exactement 6 caractères' })
  code: string;
}

export class TwoFactorAuthRecoveryDto {
  @ApiProperty({
    description: "Code de récupération d'authentification à deux facteurs",
    example: 'ABCD-1234-EFGH-5678',
  })
  @IsNotEmpty({ message: 'Code de récupération requis' })
  @IsString({
    message: 'Le code de récupération doit être une chaîne de caractères',
  })
  recoveryCode: string;
}
