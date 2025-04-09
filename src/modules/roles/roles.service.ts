import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Récupère tous les rôles
   */
  async findAll(includePermissions: boolean = false): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: includePermissions
          ? {
              include: {
                permission: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Récupère un rôle par son ID
   */
  async findById(
    id: string,
    includePermissions: boolean = false,
  ): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: includePermissions
          ? {
              include: {
                permission: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Récupère un rôle par son nom
   */
  async findByName(
    name: string,
    includePermissions: boolean = false,
  ): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: includePermissions
          ? {
              include: {
                permission: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Crée un nouveau rôle
   */
  async create(data: CreateRoleDto): Promise<Role> {
    const { name, description, permissionIds } = data;

    // Vérifier si le rôle existe déjà
    const existingRole = await this.findByName(name);
    if (existingRole) {
      throw new ConflictException(`Role with name ${name} already exists`);
    }

    // Création du rôle avec ou sans permissions
    if (permissionIds && permissionIds.length > 0) {
      return this.prisma.role.create({
        data: {
          name,
          description,
          rolePermissions: {
            create: permissionIds.map((permissionId) => ({
              permission: {
                connect: { id: permissionId },
              },
            })),
          },
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    } else {
      return this.prisma.role.create({
        data: {
          name,
          description,
        },
      });
    }
  }

  /**
   * Met à jour un rôle
   */
  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    const { name, description, permissionIds } = data;

    // Vérifier si le rôle existe
    const existingRole = await this.findById(id);
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Vérifier si le nouveau nom existe déjà
    if (name && name !== existingRole.name) {
      const roleWithSameName = await this.findByName(name);
      if (roleWithSameName) {
        throw new ConflictException(`Role with name ${name} already exists`);
      }
    }

    // Si nous avons des permissionIds à mettre à jour
    if (permissionIds !== undefined) {
      // Supprimer toutes les permissions actuelles
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Ajouter les nouvelles permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        }));

        await this.prisma.rolePermission.createMany({
          data: rolePermissions,
        });
      }
    }

    // Mettre à jour le rôle
    return this.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Supprime un rôle
   */
  async delete(id: string): Promise<Role> {
    // Vérifier si le rôle existe
    const existingRole = await this.findById(id);
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Vérifier s'il s'agit d'un rôle système (admin, user, moderator)
    if (['admin', 'user', 'moderator'].includes(existingRole.name)) {
      throw new ConflictException(
        `Cannot delete system role: ${existingRole.name}`,
      );
    }

    // Supprimer le rôle
    return this.prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Ajoute une permission à un rôle
   */
  async addPermission(roleId: string, permissionId: string): Promise<Role> {
    // Vérifier si le rôle existe
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Vérifier si la permission existe
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // Vérifier si la permission est déjà attribuée au rôle
    const existingRolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingRolePermission) {
      throw new ConflictException(
        `Role already has permission: ${permission.name}`,
      );
    }

    // Ajouter la permission au rôle
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    // Retourner le rôle mis à jour avec ses permissions
    const updatedRole = await this.findById(roleId, true);
    if (!updatedRole) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found after update`,
      );
    }

    return updatedRole;
  }

  /**
   * Supprime une permission d'un rôle
   */
  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    // Vérifier si le rôle existe
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Vérifier si la permission existe
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // Supprimer la permission du rôle
    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      });
    } catch (error) {
      throw new ConflictException(
        `Role does not have permission: ${permission.name}`,
      );
    }

    // Retourner le rôle mis à jour avec ses permissions
    const updatedRole = await this.findById(roleId, true);
    if (!updatedRole) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found after update`,
      );
    }

    return updatedRole;
  }

  /**
   * Récupère les permissions d'un rôle
   */
  async getRolePermissions(roleId: string) {
    const role = await this.findById(roleId, true);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Utiliser un cast explicite
    const roleWithPerm = role as any;
    if (
      !roleWithPerm.rolePermissions ||
      !Array.isArray(roleWithPerm.rolePermissions)
    ) {
      return [];
    }

    return roleWithPerm.rolePermissions.map((rp: any) => rp.permission);
  }

  /**
   * Récupère les utilisateurs ayant un rôle spécifique
   */
  async getRoleUsers(roleId: string) {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: true,
      },
    });

    return userRoles.map((ur) => ur.user);
  }

  /**
   * Récupère le nombre d'utilisateurs pour chaque rôle
   */
  async getRolesWithUserCount() {
    const roles = await this.findAll(true);

    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const count = await this.prisma.userRole.count({
          where: { roleId: role.id },
        });

        return {
          ...role,
          userCount: count,
        };
      }),
    );

    return rolesWithCount;
  }
}
