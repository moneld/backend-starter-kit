export interface EncryptedDataRecord {
  entityType: string;
  entityId: string;
  fieldName: string;
  encryptedData: string;
  keyVersion: number;
}

export interface IEncryptedDataRepository {
  upsert(data: EncryptedDataRecord): Promise<void>;

  find(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<EncryptedDataRecord | null>;

  findByKeyVersion(
    keyVersion: number,
    limit: number,
  ): Promise<EncryptedDataRecord[]>;

  updateKeyVersion(
    id: string,
    encryptedData: string,
    newKeyVersion: number,
  ): Promise<void>;

  delete(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<void>;
}
