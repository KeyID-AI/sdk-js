"use strict";
/**
 * Ed25519 crypto utilities for KeyID agent identity.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKeypair = generateKeypair;
exports.sign = sign;
exports.verify = verify;
const crypto = __importStar(require("crypto"));
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
function generateKeypair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    return {
        publicKey: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex'),
        privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('hex'),
    };
}
function sign(message, privateKeyHex) {
    const privDer = Buffer.concat([PKCS8_PREFIX, Buffer.from(privateKeyHex, 'hex')]);
    const key = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' });
    return crypto.sign(null, Buffer.from(message), key).toString('hex');
}
function verify(message, signatureHex, publicKeyHex) {
    try {
        const pubDer = Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]);
        const key = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' });
        return crypto.verify(null, Buffer.from(message), key, Buffer.from(signatureHex, 'hex'));
    }
    catch {
        return false;
    }
}
