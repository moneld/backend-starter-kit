import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les permissions
   */
  async findAll(includeRoles: boolean = false): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      include: {
        rolePermissions: includeRoles
          ? {
              include: {
                role: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Récupère une permission par son ID
   */
  async findById(
    id: string,
    includeRoles: boolean = false,
  ): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: includeRoles
          ? {
              include: {
                role: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Récupère une permission par son nom
   */
  async findByName(
    name: string,
    includeRoles: boolean = false,
  ): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
      include: {
        rolePermissions: includeRoles
          ? {
              include: {
                role: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Crée une nouvelle permission
   */
  async create(data: CreatePermissionDto): Promise<Permission> {
    const { name, description } = data;

    // Vérifier si la permission existe déjà
    const existingPermission = await this.findByName(name);
    if (existingPermission) {
      throw new ConflictException(
        `Permission with name ${name} already exists`,
      );
    }

    // Créer la permission
    return this.prisma.permission.create({
      data: {
        name,
        description,
      },
    });
  }

  /**
   * Met à jour une permission
   */
  async update(id: string, data: UpdatePermissionDto): Promise<Permission> {
    const { name, description } = data;

    // Vérifier si la permission existe
    const existingPermission = await this.findById(id);
    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Vérifier si le nouveau nom existe déjà
    if (name && name !== existingPermission.name) {
      const permissionWithSameName = await this.findByName(name);
      if (permissionWithSameName) {
        throw new ConflictException(
          `Permission with name ${name} already exists`,
        );
      }
    }

    // Mettre à jour la permission
    return this.prisma.permission.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
  }

  /**
   * Supprime une permission
   */
  async delete(id: string): Promise<Permission> {
    // Vérifier si la permission existe
    const existingPermission = await this.findById(id);
    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Vérifier s'il s'agit d'une permission système
    const systemPermissions = [
      'create:user',
      'read:user',
      'update:user',
      'delete:user',
      'manage:roles',
      'access:admin',
    ];

    if (systemPermissions.includes(existingPermission.name)) {
      throw new ConflictException(
        `Cannot delete system permission: ${existingPermission.name}`,
      );
    }

    // Supprimer la permission
    return this.prisma.permission.delete({
      where: { id },
    });
  }

  /**
   * Récupère les rôles associés à une permission
   */
  async getPermissionRoles(permissionId: string) {
    const permission = await this.findById(permissionId, true);
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // Utiliser as any pour accéder à rolePermissions
    const permissionWithRoles = permission as any;
    if (
      !permissionWithRoles.rolePermissions ||
      !Array.isArray(permissionWithRoles.rolePermissions)
    ) {
      return [];
    }

    return permissionWithRoles.rolePermissions.map((rp: any) => rp.role);
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async userHasPermission(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        role: {
          rolePermissions: {
            some: {
              permission: {
                name: permissionName,
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * Récupère toutes les permissions d'un utilisateur
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Extraire toutes les permissions de tous les rôles de l'utilisateur
    const permissions = new Map<string, Permission>();

    userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePermission) => {
        permissions.set(
          rolePermission.permission.id,
          rolePermission.permission,
        );
      });
    });

    return Array.from(permissions.values());
  }
}
