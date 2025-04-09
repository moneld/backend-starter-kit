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
  CreatePermissionDto,
  PermissionResponseDto,
  PermissionWithRolesDto,
  RoleMinimalDto,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('permission')
@Controller({ path: 'permission', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les permissions' })
  @ApiQuery({
    name: 'includeRoles',
    required: false,
    type: Boolean,
    description: 'Inclure les rôles dans la réponse',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des permissions récupérée avec succès',
    type: [PermissionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  async findAll(
    @Query('includeRoles') includeRoles?: boolean,
  ): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsService.findAll(
        includeRoles === true,
      );

      return permissions.map((permission) => {
        return {
          id: permission.id,
          name: permission.name,
          description: permission.description || undefined,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve permissions: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une permission par ID' })
  @ApiParam({ name: 'id', description: 'ID de la permission' })
  @ApiQuery({
    name: 'includeRoles',
    required: false,
    type: Boolean,
    description: 'Inclure les rôles dans la réponse',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission récupérée avec succès',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Permission non trouvée' })
  async findOne(
    @Param('id') id: string,
    @Query('includeRoles') includeRoles?: boolean,
  ): Promise<PermissionResponseDto | PermissionWithRolesDto> {
    try {
      const permission = await this.permissionsService.findById(
        id,
        includeRoles === true,
      );

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Utiliser as any pour éviter les problèmes de typage
      const permissionWithRoles = permission as any;

      if (includeRoles && permissionWithRoles.rolePermissions) {
        const roles = permissionWithRoles.rolePermissions.map((rp: any) => ({
          id: rp.role.id,
          name: rp.role.name,
        }));

        return {
          id: permission.id,
          name: permission.name,
          description: permission.description || undefined,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          roles,
        };
      }

      return {
        id: permission.id,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve permission with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission créée avec succès',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 409, description: 'Permission déjà existante' })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      const permission =
        await this.permissionsService.create(createPermissionDto);

      return {
        id: permission.id,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create permission: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une permission' })
  @ApiParam({ name: 'id', description: 'ID de la permission' })
  @ApiResponse({
    status: 200,
    description: 'Permission mise à jour avec succès',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Permission non trouvée' })
  @ApiResponse({ status: 409, description: 'Nom de permission déjà existant' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      const permission = await this.permissionsService.update(
        id,
        updatePermissionDto,
      );

      return {
        id: permission.id,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update permission with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une permission' })
  @ApiParam({ name: 'id', description: 'ID de la permission' })
  @ApiResponse({ status: 204, description: 'Permission supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Permission non trouvée' })
  @ApiResponse({
    status: 409,
    description: 'Impossible de supprimer une permission système',
  })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      await this.permissionsService.delete(id);
    } catch (error) {
      this.logger.error(
        `Failed to delete permission with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Récupérer les rôles associés à une permission' })
  @ApiParam({ name: 'id', description: 'ID de la permission' })
  @ApiResponse({
    status: 200,
    description: 'Rôles récupérés avec succès',
    type: [RoleMinimalDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Autorisation insuffisante' })
  @ApiResponse({ status: 404, description: 'Permission non trouvée' })
  async getPermissionRoles(@Param('id') id: string): Promise<RoleMinimalDto[]> {
    try {
      const roles = await this.permissionsService.getPermissionRoles(id);
      return roles;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve roles for permission with ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
