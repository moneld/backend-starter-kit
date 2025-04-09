import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

class RoleDto {
  @ApiProperty({
    description: 'Identifiant unique du rôle',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nom du rôle',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: 'Description du rôle',
    example: 'Administrateur du système',
  })
  description?: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'John',
  })
  firstName?: string;

  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({
    description: "Statut d'activation de l'utilisateur",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Statut de vérification de l'utilisateur",
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Date de la dernière connexion',
    example: '2023-01-01T00:00:00.000Z',
  })
  lastLogin?: Date;

  @ApiProperty({
    description: "Indique si l'authentification à deux facteurs est activée",
    example: false,
  })
  isTwoFactorEnabled: boolean;

  @ApiProperty({
    description: "Date de création de l'utilisateur",
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date de dernière mise à jour de l'utilisateur",
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Rôles de l'utilisateur",
    type: [RoleDto],
  })
  roles?: RoleDto[];

  constructor(user: User, roles?: RoleDto[]) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName || undefined;
    this.lastName = user.lastName || undefined;
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.lastLogin = user.lastLogin || undefined;
    this.isTwoFactorEnabled = user.isTwoFactorEnabled;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.roles = roles;
  }

  static fromEntity(user: User, userRoles?: any[]): UserResponseDto {
    if (!user) {
      // Créer un DTO vide si l'utilisateur est null
      // plutôt que de retourner null
      const emptyUser = {
        id: '',
        email: '',
        password: '',
        firstName: null,
        lastName: null,
        isActive: false,
        isVerified: false,
        lastLogin: null,
        refreshToken: null,
        verificationToken: null,
        verificationExpires: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0,
        lockedUntil: null,
        twoFactorAuthSecret: null,
        isTwoFactorEnabled: false,
        twoFactorRecoveryCodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      return new UserResponseDto(emptyUser, []);
    }

    // Traiter les userRoles de façon sécurisée
    const roles = Array.isArray(userRoles)
      ? userRoles.map((ur) => ({
          id: ur.role?.id || '',
          name: ur.role?.name || '',
          description: ur.role?.description,
        }))
      : [];

    return new UserResponseDto(user, roles);
  }
}

export class PaginatedUserResponseDto {
  @ApiProperty({
    description: 'Liste des utilisateurs',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
