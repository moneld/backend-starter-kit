import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HashService } from '../auth/services/hash.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedUserResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiBearerAuth()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Hacher le mot de passe
      const hashedPassword = await this.hashService.hash(
        createUserDto.password,
      );

      // Créer l'utilisateur avec le mot de passe haché
      const user = await this.usersService.create({
        ...createUserDto,
        password: hashedPassword,
      });

      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = user as any;
      return UserResponseDto.fromEntity(user, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Récupérer tous les utilisateurs avec pagination et filtres',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès',
    type: PaginatedUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiBearerAuth()
  async findAll(
    @Query() queryDto: QueryUserDto,
  ): Promise<PaginatedUserResponseDto> {
    try {
      const { users, total } = await this.usersService.findAll(queryDto);

      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const totalPages = Math.ceil(total / limit);

      return {
        data: users.map((user) => {
          // Utiliser as any pour éviter les problèmes de typage
          const userWithRoles = user as any;
          return UserResponseDto.fromEntity(user, userWithRoles.userRoles);
        }),
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve users: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur récupéré avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersService.findOne(id);

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = user as any;
      return UserResponseDto.fromEntity(user, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // Vérifier si l'utilisateur existe
      const existingUser = await this.usersService.findOne(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Si un nouveau mot de passe est fourni, le hacher
      if (updateUserDto.password) {
        updateUserDto.password = await this.hashService.hash(
          updateUserDto.password,
        );
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await this.usersService.update(id, updateUserDto);

      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = updatedUser as any;
      return UserResponseDto.fromEntity(updatedUser, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(
        `Failed to update user with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiBearerAuth()
  async remove(@Param('id') id: string): Promise<void> {
    try {
      // Vérifier si l'utilisateur existe
      const existingUser = await this.usersService.findOne(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Supprimer l'utilisateur
      await this.usersService.delete(id);
    } catch (error) {
      this.logger.error(
        `Failed to delete user with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('profile/me')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBearerAuth()
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    try {
      // Récupérer l'utilisateur complet avec ses rôles
      const completeUser = await this.usersService.findOne(user.id);

      if (!completeUser) {
        throw new NotFoundException('User not found');
      }

      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = completeUser as any;
      return UserResponseDto.fromEntity(completeUser, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(`Failed to retrieve profile: ${error.message}`);
      throw error;
    }
  }

  @Put('profile/me')
  @ApiOperation({
    summary: "Mettre à jour le profil de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBearerAuth()
  async updateProfile(
    @CurrentUser() user: User,
    @Body()
    updateProfileDto: Omit<
      UpdateUserDto,
      'isActive' | 'isVerified' | 'roleIds'
    >,
  ): Promise<UserResponseDto> {
    try {
      // Limiter les champs que l'utilisateur peut mettre à jour sur son propre profil
      const allowedUpdates: any = {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
      };

      // Si un nouveau mot de passe est fourni, le hacher
      if (updateProfileDto.password) {
        allowedUpdates.password = await this.hashService.hash(
          updateProfileDto.password,
        );
      }

      // Mettre à jour le profil
      const updatedUser = await this.usersService.update(
        user.id,
        allowedUpdates,
      );

      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = updatedUser as any;
      return UserResponseDto.fromEntity(updatedUser, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(`Failed to update profile: ${error.message}`);
      throw error;
    }
  }

  @Post(':id/roles/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: 'Ajouter un rôle à un utilisateur' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiParam({ name: 'roleId', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle ajouté avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "L'utilisateur a déjà ce rôle" })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
  @ApiBearerAuth()
  async addRoleToUser(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ): Promise<UserResponseDto> {
    try {
      const updatedUser = await this.usersService.addRoleToUser(id, roleId);
      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = updatedUser as any;
      return UserResponseDto.fromEntity(updatedUser, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(
        `Failed to add role ${roleId} to user ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id/roles/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: "Supprimer un rôle d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiParam({ name: 'roleId', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle supprimé avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "L'utilisateur n'a pas ce rôle" })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
  @ApiBearerAuth()
  async removeRoleFromUser(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ): Promise<UserResponseDto> {
    try {
      const updatedUser = await this.usersService.removeRoleFromUser(
        id,
        roleId,
      );
      // Utiliser as any pour éviter les problèmes de typage
      const userWithRoles = updatedUser as any;
      return UserResponseDto.fromEntity(updatedUser, userWithRoles.userRoles);
    } catch (error) {
      this.logger.error(
        `Failed to remove role ${roleId} from user ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id/roles')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: "Récupérer les rôles d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Rôles récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiBearerAuth()
  async getUserRoles(@Param('id') id: string) {
    try {
      return await this.usersService.getUserRoles(id);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve roles for user ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
