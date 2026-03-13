/**
 * Ed25519 crypto utilities for KeyID agent identity.
 */
export interface Keypair {
    publicKey: string;
    privateKey: string;
}
export declare function generateKeypair(): Keypair;
export declare function sign(message: string, privateKeyHex: string): string;
export declare function verify(message: string, signatureHex: string, publicKeyHex: string): boolean;
