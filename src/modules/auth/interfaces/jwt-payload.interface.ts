export interface JwtPayload {
  sub: string; // ID de l'utilisateur
  email: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  twoFactorAuthenticated?: boolean; // Optionnel, pour indiquer si l'authentification à deux facteurs a été validée
}
