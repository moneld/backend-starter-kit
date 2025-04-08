import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    // Création des permissions de base
    const createUserPermission = await prisma.permission.upsert({
        where: { name: 'create:user' },
        update: {},
        create: {
            name: 'create:user',
            description: 'Créer un utilisateur',
        },
    });

    const readUserPermission = await prisma.permission.upsert({
        where: { name: 'read:user' },
        update: {},
        create: {
            name: 'read:user',
            description: "Lire les informations d'un utilisateur",
        },
    });

    const updateUserPermission = await prisma.permission.upsert({
        where: { name: 'update:user' },
        update: {},
        create: {
            name: 'update:user',
            description: 'Mettre à jour un utilisateur',
        },
    });

    const deleteUserPermission = await prisma.permission.upsert({
        where: { name: 'delete:user' },
        update: {},
        create: {
            name: 'delete:user',
            description: 'Supprimer un utilisateur',
        },
    });

    const manageRolesPermission = await prisma.permission.upsert({
        where: { name: 'manage:roles' },
        update: {},
        create: {
            name: 'manage:roles',
            description: 'Gérer les rôles',
        },
    });

    const accessAdminPermission = await prisma.permission.upsert({
        where: { name: 'access:admin' },
        update: {},
        create: {
            name: 'access:admin',
            description: "Accéder à l'interface d'administration",
        },
    });

    console.log('Permissions créées:');
    console.log({
        createUserPermission,
        readUserPermission,
        updateUserPermission,
        deleteUserPermission,
        manageRolesPermission,
        accessAdminPermission,
    });

    // Création des rôles de base
    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            description: 'Utilisateur standard',
            rolePermissions: {
                create: [{ permissionId: readUserPermission.id }],
            },
        },
    });

    const moderatorRole = await prisma.role.upsert({
        where: { name: 'moderator' },
        update: {},
        create: {
            name: 'moderator',
            description: 'Modérateur',
            rolePermissions: {
                create: [
                    { permissionId: readUserPermission.id },
                    { permissionId: updateUserPermission.id },
                ],
            },
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
            description: 'Administrateur',
            rolePermissions: {
                create: [
                    { permissionId: createUserPermission.id },
                    { permissionId: readUserPermission.id },
                    { permissionId: updateUserPermission.id },
                    { permissionId: deleteUserPermission.id },
                    { permissionId: manageRolesPermission.id },
                    { permissionId: accessAdminPermission.id },
                ],
            },
        },
    });

    console.log('Rôles créés:');
    console.log({ userRole, moderatorRole, adminRole });

    // Création de l'utilisateur admin
    const hashedPassword = await argon2.hash('admin123', {
        type: argon2.argon2id,
        memoryCost: 4096,
        timeCost: 3,
        parallelism: 1,
    });

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
            isVerified: true,
            userRoles: {
                create: [{ roleId: adminRole.id }],
            },
        },
    });

    console.log('Utilisateur admin créé:');
    console.log(adminUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
