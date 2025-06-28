export interface KeyRotationResult {
  newKeyVersion: number;
  rotatedDataCount: number;
  duration: number;
}

export interface IKeyRotationService {
  rotateKeys(): Promise<KeyRotationResult>;

  shouldRotate(): Promise<boolean>;

  getRotationStatus(): Promise<{
    currentKeyVersion: number;
    lastRotation: Date | null;
    nextRotation: Date;
    keysToRotate: number;
  }>;
}