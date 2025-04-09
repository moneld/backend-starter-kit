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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateRoleDto,
  PermissionDto,
  RoleResponseDto,
  RoleWithUsersDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller({ path: 'roles', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rôles' })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    description: 'Inclure les permissions dans la réponse',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles récupérée avec succès',
    type: [RoleResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  async findAll(
    @Query('includePermissions') includePermissions?: boolean,
  ): Promise<RoleResponseDto[]> {
    try {
      const roles = await this.rolesService.findAll(
        includePermissions === true,
      );

      return roles.map((role) => {
        // Utiliser un cast explicite
        const roleWithPerm = role as any;
        const permissions =
          roleWithPerm.rolePermissions?.map((rp: any) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description || undefined,
          })) || [];

        return {
          id: role.id,
          name: role.name,
          description: role.description || undefined,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: includePermissions ? permissions : undefined,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve roles: ${error.message}`);
      throw error;
    }
  }

  @Get('with-user-count')
  @ApiOperation({
    summary: "Récupérer tous les rôles avec le nombre d'utilisateurs",
  })
  @ApiResponse({
    status: 200,
    description:
      'Liste des rôles avec comptage utilisateurs récupérée avec succès',
    type: [RoleWithUsersDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  async getRolesWithUserCount(): Promise<RoleWithUsersDto[]> {
    try {
      const rolesWithCount = await this.rolesService.getRolesWithUserCount();

      return rolesWithCount.map((role) => {
        // Utiliser un cast explicite
        const roleWithPerm = role as any;
        const permissions =
          roleWithPerm.rolePermissions?.map((rp: any) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description || undefined,
          })) || [];

        return {
          id: role.id,
          name: role.name,
          description: role.description || undefined,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: permissions,
          userCount: role.userCount,
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to retrieve roles with user count: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rôle par ID' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    description: 'Inclure les permissions dans la réponse',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle récupéré avec succès',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async findOne(
    @Param('id') id: string,
    @Query('includePermissions') includePermissions?: boolean,
  ): Promise<RoleResponseDto> {
    try {
      const role = await this.rolesService.findById(
        id,
        includePermissions === true,
      );

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Utiliser un cast explicite
      const roleWithPerm = role as any;
      const permissions =
        roleWithPerm.rolePermissions?.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || undefined,
        })) || [];

      return {
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: includePermissions ? permissions : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve role with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rôle' })
  @ApiResponse({
    status: 201,
    description: 'Rôle créé avec succès',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 409, description: 'Rôle déjà existant' })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    try {
      const role = await this.rolesService.create(createRoleDto);

      // Récupérer le rôle avec ses permissions
      return this.findOne(role.id, true);
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour avec succès',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom de rôle déjà existant' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    try {
      await this.rolesService.update(id, updateRoleDto);

      // Récupérer le rôle mis à jour avec ses permissions
      return this.findOne(id, true);
    } catch (error) {
      this.logger.error(
        `Failed to update role with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({ status: 204, description: 'Rôle supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({
    status: 409,
    description: 'Impossible de supprimer un rôle système',
  })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      await this.rolesService.delete(id);
    } catch (error) {
      this.logger.error(
        `Failed to delete role with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: "Récupérer les permissions d'un rôle" })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Permissions récupérées avec succès',
    type: [PermissionDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async getRolePermissions(@Param('id') id: string): Promise<PermissionDto[]> {
    try {
      const permissions = await this.rolesService.getRolePermissions(id);
      return permissions.map((perm: any) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description || undefined,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to retrieve permissions for role with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Ajouter une permission à un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiParam({ name: 'permissionId', description: 'ID de la permission' })
  @ApiResponse({
    status: 200,
    description: 'Permission ajoutée avec succès',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle ou permission non trouvé' })
  @ApiResponse({ status: 409, description: 'Le rôle a déjà cette permission' })
  async addPermissionToRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleResponseDto> {
    try {
      await this.rolesService.addPermission(id, permissionId);
      return this.findOne(id, true);
    } catch (error) {
      this.logger.error(
        `Failed to add permission ${permissionId} to role ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: "Supprimer une permission d'un rôle" })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiParam({ name: 'permissionId', description: 'ID de la permission' })
  @ApiResponse({
    status: 200,
    description: 'Permission supprimée avec succès',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle ou permission non trouvé' })
  @ApiResponse({ status: 409, description: "Le rôle n'a pas cette permission" })
  async removePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleResponseDto> {
    try {
      await this.rolesService.removePermission(id, permissionId);
      return this.findOne(id, true);
    } catch (error) {
      this.logger.error(
        `Failed to remove permission ${permissionId} from role ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Récupérer les utilisateurs ayant un rôle spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateurs récupérés avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiBearerAuth()
  async getRoleUsers(@Param('id') id: string): Promise<any[]> {
    try {
      const users = await this.rolesService.getRoleUsers(id);

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        lastLogin: user.lastLogin || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to retrieve users for role with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
