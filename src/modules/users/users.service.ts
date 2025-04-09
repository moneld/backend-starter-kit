import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto, UserSortField } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(
    createUserDto: CreateUserDto | Prisma.UserCreateInput,
  ): Promise<User> {
    // Si c'est un DTO avec des roleIds
    if (
      'roleIds' in createUserDto &&
      Array.isArray(createUserDto.roleIds) &&
      createUserDto.roleIds.length > 0
    ) {
      const { roleIds, ...userData } = createUserDto;

      return this.prisma.user.create({
        data: {
          ...userData,
          userRoles: {
            create: roleIds.map((roleId) => ({
              role: {
                connect: { id: roleId },
              },
            })),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    // S'il s'agit d'un input Prisma standard
    return this.prisma.user.create({
      data: createUserDto as Prisma.UserCreateInput,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto | Prisma.UserUpdateInput,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Si nous avons des roleIds à mettre à jour
    if ('roleIds' in updateUserDto && Array.isArray(updateUserDto.roleIds)) {
      const { roleIds, ...userData } = updateUserDto;

      // Supprimer d'abord tous les rôles actuels
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Ajouter les nouveaux rôles
      const userRoles = roleIds.map((roleId) => ({
        roleId,
        userId: id,
      }));

      if (userRoles.length > 0) {
        await this.prisma.userRole.createMany({
          data: userRoles,
        });
      }

      // Mettre à jour les autres données utilisateur
      return this.prisma.user.update({
        where: { id },
        data: userData,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    // Mise à jour standard sans modification des rôles
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto as Prisma.UserUpdateInput,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.delete({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll(
    queryDto: QueryUserDto,
  ): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      email,
      firstName,
      lastName,
      isActive,
      isVerified,
      sortBy = UserSortField.CREATED_AT,
      sortOrder = 'desc',
      roleId,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Construire les filtres de recherche
    const where: Prisma.UserWhereInput = {};

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (firstName) {
      where.firstName = { contains: firstName, mode: 'insensitive' };
    }

    if (lastName) {
      where.lastName = { contains: lastName, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    // Filtre par rôle
    if (roleId) {
      where.userRoles = {
        some: {
          roleId,
        },
      };
    }

    // Définir l'ordre de tri
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Exécuter la requête de décompte et de récupération des données en parallèle
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
    ]);

    return { users, total };
  }

  async incrementLoginAttempts(email: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: {
        loginAttempts: {
          increment: 1,
        },
      },
    });
  }

  async resetLoginAttempts(email: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: {
        loginAttempts: 0,
      },
    });
  }

  async lockAccount(email: string, duration: number): Promise<User> {
    const lockUntil = new Date();
    lockUntil.setSeconds(lockUntil.getSeconds() + duration);

    return this.prisma.user.update({
      where: { email },
      data: {
        lockedUntil: lockUntil,
      },
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async getUserIfRefreshTokenMatches(
    userId: string,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.findOne(userId);

    if (!user || !user.refreshToken) {
      return null;
    }

    if (user.refreshToken === refreshToken) {
      return user;
    }

    return null;
  }

  async setTwoFactorAuthSecret(userId: string, secret: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorAuthSecret: secret,
      },
    });
  }

  async enableTwoFactorAuth(
    userId: string,
    recoveryCodes: string[],
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: true,
        twoFactorRecoveryCodes: recoveryCodes,
      },
    });
  }

  async disableTwoFactorAuth(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorAuthSecret: null,
        twoFactorRecoveryCodes: [],
      },
    });
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  async setVerificationToken(
    email: string,
    token: string,
    expiresIn: number,
  ): Promise<User> {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

    return this.prisma.user.update({
      where: { email },
      data: {
        verificationToken: token,
        verificationExpires: expirationDate,
      },
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });
  }

  async setResetPasswordToken(
    email: string,
    token: string,
    expiresIn: number,
  ): Promise<User> {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

    return this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expirationDate,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    // Vérifier si l'utilisateur existe
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Vérifier si le rôle existe
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Vérifier si l'utilisateur a déjà ce rôle
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingUserRole) {
      throw new BadRequestException(`User already has the role ${role.name}`);
    }

    // Ajouter le rôle à l'utilisateur
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    // Retourner l'utilisateur mis à jour
    const updatedUser = await this.findOne(userId);
    if (!updatedUser) {
      throw new NotFoundException(
        `User with ID ${userId} not found after update`,
      );
    }
    return updatedUser;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    // Vérifier si l'utilisateur existe
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Vérifier si le rôle existe
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Supprimer le rôle de l'utilisateur
    await this.prisma.userRole
      .delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      })
      .catch(() => {
        throw new BadRequestException(
          `User does not have the role ${role.name}`,
        );
      });

    // Retourner l'utilisateur mis à jour
    const updatedUser = await this.findOne(userId);
    if (!updatedUser) {
      throw new NotFoundException(
        `User with ID ${userId} not found after update`,
      );
    }
    return updatedUser;
  }

  async getUserRoles(userId: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Le type User de Prisma n'inclut pas userRoles directement
    // Nous devons donc traiter cela comme une donnée inconnue
    const userWithRoles = user as any;
    if (!userWithRoles.userRoles || !Array.isArray(userWithRoles.userRoles)) {
      return [];
    }

    return userWithRoles.userRoles.map((userRole: any) => userRole.role);
  }
}
