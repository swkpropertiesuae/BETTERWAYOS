import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { resolveDataDir } from '@/server/db/data-dir';

export type EncryptedPayload = {
  ciphertext: Buffer;
  ivHex: string;
  authTagHex: string;
  sha256Hash: string;
};

export function encryptVaultBytes(plain: Buffer, masterKey: Buffer): EncryptedPayload {
  if (masterKey.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte master key');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const sha256Hash = createHash('sha256').update(plain).digest('hex');

  return {
    ciphertext,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    sha256Hash,
  };
}

export function decryptVaultBytes(ciphertext: Buffer, masterKey: Buffer, ivHex: string, authTagHex: string): Buffer {
  if (masterKey.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte master key');
  }
  const decipher = createDecipheriv('aes-256-gcm', masterKey, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function getOrCreateVaultMasterKey(dataDir = resolveDataDir()): Buffer {
  if (process.env.BW_VAULT_MASTER_KEY) {
    const envBuf = Buffer.from(process.env.BW_VAULT_MASTER_KEY, 'hex');
    if (envBuf.length === 32) return envBuf;
  }
  mkdirSync(dataDir, { recursive: true });
  const keyFile = path.join(dataDir, '.vault.key');
  if (existsSync(keyFile)) {
    const existing = Buffer.from(readFileSync(keyFile, 'utf8').trim(), 'hex');
    if (existing.length === 32) return existing;
  }
  const generated = randomBytes(32);
  writeFileSync(keyFile, generated.toString('hex'), { mode: 0o600 });
  return generated;
}

export function writeEncryptedVaultFile(
  dealId: number,
  docUuid: string,
  plain: Buffer,
  dataDir = resolveDataDir(),
): EncryptedPayload & { relativePath: string } {
  const key = getOrCreateVaultMasterKey(dataDir);
  const enc = encryptVaultBytes(plain, key);
  const relDir = path.join('vault', String(dealId));
  const fullDir = path.join(dataDir, relDir);
  mkdirSync(fullDir, { recursive: true });
  const relativePath = path.join(relDir, `${docUuid}.enc`);
  writeFileSync(path.join(dataDir, relativePath), enc.ciphertext);
  return { ...enc, relativePath };
}

export function readEncryptedVaultFile(
  relativePath: string,
  ivHex: string,
  authTagHex: string,
  dataDir = resolveDataDir(),
): Buffer {
  const resolvedBase = path.resolve(dataDir);
  const resolvedTarget = path.resolve(dataDir, relativePath);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    throw new Error('Vault path traversal blocked');
  }
  const key = getOrCreateVaultMasterKey(resolvedBase);
  const ciphertext = readFileSync(resolvedTarget);
  return decryptVaultBytes(ciphertext, key, ivHex, authTagHex);
}
