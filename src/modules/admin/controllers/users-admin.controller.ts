// src/modules/admin/controllers/users-admin.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { QueryUserDto } from '../../users/dto/query-user.dto';

@ApiTags('Admin Users')
@Controller({ path: 'admin/users', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UsersAdminController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Obtenir tous les utilisateurs' })
    @ApiResponse({ status: 200, description: 'Utilisateurs récupérés avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async findAll(@Query() queryDto: QueryUserDto) {
        return this.usersService.findAll(queryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
    @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
    @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async remove(@Param('id') id: string) {
        return this.usersService.delete(id);
    }

    @Get(':id/roles')
    @ApiOperation({ summary: 'Obtenir les rôles d\'un utilisateur' })
    @ApiResponse({ status: 200, description: 'Rôles récupérés avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async getUserRoles(@Param('id') id: string) {
        return this.usersService.getUserRoles(id);
    }

    @Post(':id/roles/:roleId')
    @ApiOperation({ summary: 'Ajouter un rôle à un utilisateur' })
    @ApiResponse({ status: 200, description: 'Rôle ajouté avec succès' })
    @ApiResponse({ status: 400, description: 'L\'utilisateur a déjà ce rôle' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
    async addRoleToUser(@Param('id') id: string, @Param('roleId') roleId: string) {
        return this.usersService.addRoleToUser(id, roleId);
    }

    @Delete(':id/roles/:roleId')
    @ApiOperation({ summary: 'Supprimer un rôle d\'un utilisateur' })
    @ApiResponse({ status: 200, description: 'Rôle supprimé avec succès' })
    @ApiResponse({ status: 400, description: 'L\'utilisateur n\'a pas ce rôle' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
    async removeRoleFromUser(@Param('id') id: string, @Param('roleId') roleId: string) {
        return this.usersService.removeRoleFromUser(id, roleId);
    }
}