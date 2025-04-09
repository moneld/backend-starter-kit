// src/modules/admin/controllers/roles-admin.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRoleDto, UpdateRoleDto } from '../../roles/dto/role.dto';
import { RolesService } from '../../roles/roles.service';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Admin Roles')
@Controller({ path: 'admin/roles', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class RolesAdminController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les rôles' })
  @ApiResponse({ status: 200, description: 'Rôles récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async findAll(@Query('includePermissions') includePermissions?: boolean) {
    return this.rolesService.findAll(includePermissions === true);
  }

  @Get('with-user-count')
  @ApiOperation({
    summary: "Obtenir tous les rôles avec le nombre d'utilisateurs",
  })
  @ApiResponse({
    status: 200,
    description: 'Rôles avec comptage utilisateurs récupérés avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async getRolesWithUserCount() {
    return this.rolesService.getRolesWithUserCount();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un rôle par ID' })
  @ApiResponse({ status: 200, description: 'Rôle récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async findOne(
    @Param('id') id: string,
    @Query('includePermissions') includePermissions?: boolean,
  ) {
    return this.rolesService.findById(id, includePermissions === true);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rôle' })
  @ApiResponse({ status: 201, description: 'Rôle créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 409, description: 'Rôle déjà existant' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom de rôle déjà existant' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiResponse({ status: 204, description: 'Rôle supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({
    status: 409,
    description: 'Impossible de supprimer un rôle système',
  })
  async remove(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: "Obtenir les permissions d'un rôle" })
  @ApiResponse({
    status: 200,
    description: 'Permissions récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Post(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Ajouter une permission à un rôle' })
  @ApiResponse({ status: 200, description: 'Permission ajoutée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle ou permission non trouvé' })
  @ApiResponse({ status: 409, description: 'Le rôle a déjà cette permission' })
  async addPermissionToRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.addPermission(id, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: "Supprimer une permission d'un rôle" })
  @ApiResponse({ status: 200, description: 'Permission supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle ou permission non trouvé' })
  @ApiResponse({ status: 409, description: "Le rôle n'a pas cette permission" })
  async removePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Obtenir les utilisateurs ayant un rôle spécifique',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateurs récupérés avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async getRoleUsers(@Param('id') id: string) {
    return this.rolesService.getRoleUsers(id);
  }
}
