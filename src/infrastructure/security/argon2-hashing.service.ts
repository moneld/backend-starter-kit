import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IHashingService } from '@domain/services/hashing.service.interface';

@Injectable()
export class Argon2HashingService implements IHashingService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  };

  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
