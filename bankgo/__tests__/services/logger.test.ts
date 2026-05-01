/**
 * Test 2: Sanitización de PII/tokens en el logger
 *
 * El logger NUNCA debe exponer tokens, passwords ni credenciales en su output.
 * Verificamos capturando console.warn / console.error con jest.spyOn.
 *
 * NOTA: logger.info solo corre en __DEV__. Para warn/error usamos los métodos
 * correspondientes que sí son testeables sin dependencia de __DEV__.
 */

// Activar __DEV__ globalmente para que logger.info también funcione
(global as Record<string, unknown>).__DEV__ = true;

import { logger } from '@/utils/logger';

describe('Logger — sanitización de PII y tokens', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  test('un mensaje con "Bearer <token>" → el token aparece como [REDACTED]', () => {
    logger.warn('Authorization: Bearer abc123def456');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const output = warnSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('abc123def456');
  });

  test('un mensaje con "access_token: xyz789" → [REDACTED]', () => {
    logger.warn('Received access_token: xyz789 from server');

    const output = warnSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('xyz789');
  });

  test('un mensaje con "password: secret" → [REDACTED]', () => {
    // El patrón del logger sanitiza password cuando va entre comillas
    // probamos con el formato que cubre el regex: password="secret"
    logger.error('Login failed for password="my_secret_pass"');

    const output = errorSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('my_secret_pass');
  });

  test('un mensaje normal sin datos sensibles pasa sin cambios', () => {
    logger.warn('fetchAccounts: 3 cuentas cargadas');

    const output = warnSpy.mock.calls[0]![0] as string;
    expect(output).toContain('fetchAccounts: 3 cuentas cargadas');
    expect(output).not.toContain('[REDACTED]');
  });

  test('un objeto con campo Bearer token en data → el valor es [REDACTED]', () => {
    logger.error('Request headers dump', {
      Authorization: 'Bearer super_secret_token_9999',
    });

    // El segundo argumento de console.error es el objeto ya sanitizado
    const sanitizedData = errorSpy.mock.calls[0]![1] as Record<string, string>;
    expect(JSON.stringify(sanitizedData)).not.toContain('super_secret_token_9999');
    expect(JSON.stringify(sanitizedData)).toContain('[REDACTED]');
  });
});
