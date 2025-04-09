import { User } from '@prisma/client';

/**
 * Transforme un utilisateur pour la réponse API en supprimant les données sensibles
 */
export function transformUser(
  user: User,
): Omit<
  User,
  | 'password'
  | 'refreshToken'
  | 'twoFactorAuthSecret'
  | 'twoFactorRecoveryCodes'
  | 'verificationToken'
  | 'resetPasswordToken'
> {
  // Créer une copie de l'objet utilisateur
  const {
    password,
    refreshToken,
    twoFactorAuthSecret,
    twoFactorRecoveryCodes,
    verificationToken,
    resetPasswordToken,
    ...safeUser
  } = user;

  return safeUser;
}

/**
 * Transforme un utilisateur pour l'administrateur (avec plus d'informations)
 */
export function transformUserForAdmin(
  user: User,
): Omit<
  User,
  'password' | 'refreshToken' | 'twoFactorAuthSecret' | 'twoFactorRecoveryCodes'
> {
  // Créer une copie de l'objet utilisateur
  const {
    password,
    refreshToken,
    twoFactorAuthSecret,
    twoFactorRecoveryCodes,
    ...adminUser
  } = user;

  return adminUser;
}

/**
 * Transforme un utilisateur pour lui-même (avec certaines informations sensibles)
 */
export function transformUserForSelf(
  user: User,
): Omit<
  User,
  | 'password'
  | 'refreshToken'
  | 'twoFactorAuthSecret'
  | 'verificationToken'
  | 'resetPasswordToken'
> {
  // Créer une copie de l'objet utilisateur
  const {
    password,
    refreshToken,
    twoFactorAuthSecret,
    verificationToken,
    resetPasswordToken,
    ...selfUser
  } = user;

  return {
    ...selfUser,
    // Masked recovery codes: only show existence, not the actual codes
    twoFactorRecoveryCodes:
      user.twoFactorRecoveryCodes?.length > 0
        ? Array(user.twoFactorRecoveryCodes.length).fill('********')
        : [],
  };
}
