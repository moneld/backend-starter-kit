export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Durée de validité du token d'accès en secondes
}
