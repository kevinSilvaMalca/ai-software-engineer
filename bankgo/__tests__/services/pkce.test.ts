/**
 * Test 1: Verificación PKCE (RFC 7636)
 *
 * expo-crypto es nativo y no funciona en Jest — lo mockeamos con Node.js crypto.
 */

// expo-crypto es nativo — mockeamos con require() lazy para que Babel
// no intente resolver las variables antes de inicializarlas
jest.mock('expo-crypto', () => ({
  getRandomBytes: (size: number) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('crypto').randomBytes(size);
  },
  digest: async (_algorithm: string, data: Uint8Array) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHash } = require('crypto') as typeof import('crypto');
    const hash = createHash('sha256');
    hash.update(Buffer.from(data));
    return hash.digest().buffer;
  },
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

import { createHash } from 'crypto';

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '@/services/auth/pkce';

// ---------------------------------------------------------------------------
// Helper: computa el SHA-256 base64url esperado usando Node.js crypto
// (esto es el "oráculo" contra el que comparamos la implementación)
// ---------------------------------------------------------------------------
function expectedChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest();
  // base64url sin padding
  return Buffer.from(hash)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

describe('PKCE — RFC 7636', () => {
  test('generateCodeVerifier produce un string de 43+ chars URL-safe sin padding', async () => {
    const verifier = await generateCodeVerifier();

    // RFC 7636 §4.1: mínimo 43 chars
    expect(verifier.length).toBeGreaterThanOrEqual(43);

    // Solo caracteres base64url: A-Z a-z 0-9 - _
    // Sin espacios, sin +, sin /, sin =
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  test('generateCodeChallenge produce el SHA-256 base64url correcto del verifier', async () => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // Calcular el valor esperado con Node.js crypto como oráculo
    const expected = expectedChallenge(verifier);

    expect(challenge).toBe(expected);
  });

  test('generateCodeChallenge output solo contiene chars base64url (sin =)', async () => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // No debe contener padding ni chars de base64 estándar + /
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge).not.toContain('=');
    expect(challenge).not.toContain('+');
    expect(challenge).not.toContain('/');
  });

  test('generateState produce un hex string de exactamente 32 chars (16 bytes)', async () => {
    const state = await generateState();

    // 16 bytes → 32 chars hex
    expect(state).toHaveLength(32);
    expect(state).toMatch(/^[0-9a-f]+$/);
  });

  test('generateCodeVerifier produce valores distintos en cada llamada (aleatoriedad)', async () => {
    const v1 = await generateCodeVerifier();
    const v2 = await generateCodeVerifier();

    // La probabilidad de colisión con 32 bytes aleatorios es 1/(2^256) ≈ 0
    expect(v1).not.toBe(v2);
  });
});
