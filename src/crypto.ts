/**
 * Ed25519 crypto utilities for KeyID agent identity.
 */

import * as crypto from 'crypto';

export interface Keypair {
  publicKey: string;  // hex
  privateKey: string; // hex
}

const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

export function generateKeypair(): Keypair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('hex'),
  };
}

export function sign(message: string, privateKeyHex: string): string {
  const privDer = Buffer.concat([PKCS8_PREFIX, Buffer.from(privateKeyHex, 'hex')]);
  const key = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' });
  return crypto.sign(null, Buffer.from(message), key).toString('hex');
}

export function verify(message: string, signatureHex: string, publicKeyHex: string): boolean {
  try {
    const pubDer = Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]);
    const key = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.from(message), key, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}
