export interface EncryptionResult {
  encryptedData: string;
  keyVersion: number;
}

export interface IEncryptionService {
  encrypt(plaintext: string): Promise<EncryptionResult>;

  decrypt(encryptedData: string): Promise<string>;

  encryptWithKey(
    plaintext: string,
    key: Buffer,
    keyVersion: number,
  ): EncryptionResult;

  decryptWithKey(
    encryptedData: string,
    key: Buffer,
  ): string;
}