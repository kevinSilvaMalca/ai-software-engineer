/**
 * Test 4: CacheService con TTL
 *
 * Verificamos que el cache lee/escribe correctamente y que respeta el TTL.
 * AsyncStorage se mockea en memoria para no depender del sistema nativo.
 *
 * NOTA: jest.mock() es elevado al tope por Babel — las variables del scope
 * no están disponibles dentro del factory. Usamos un objeto compartido
 * con prefijo "mock" (permitido por Jest) para el storage en memoria.
 */

// Storage en memoria — prefijo "mock" para que Babel lo permita en jest.mock()
const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

import { cacheService } from '@/services/cache/cacheService';
import type { Account } from '@/types/index';

beforeEach(() => {
  mockStorage.clear();
  jest.useRealTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('cacheService — TTL y persistencia', () => {
  test('set() + get() retorna los datos correctamente', async () => {
    await cacheService.set('test:key', { value: 42 }, 60_000);
    const result = await cacheService.get<{ value: number }>('test:key');

    expect(result).not.toBeNull();
    expect(result?.value).toBe(42);
  });

  test('set() con TTL expirado → get() retorna null', async () => {
    jest.useFakeTimers();

    // Guardamos con TTL de 1 segundo
    await cacheService.set('test:expired', { secret: 'data' }, 1_000);

    // Avanzamos el tiempo 2 segundos → TTL expirado
    jest.advanceTimersByTime(2_000);

    const result = await cacheService.get<{ secret: string }>('test:expired');

    expect(result).toBeNull();
  });

  test('remove() + get() retorna null', async () => {
    await cacheService.set('test:remove', 'valor', 60_000);
    await cacheService.remove('test:remove');

    const result = await cacheService.get<string>('test:remove');

    expect(result).toBeNull();
  });

  test('get() de clave inexistente retorna null sin lanzar error', async () => {
    // No hay nada en storage para esta clave
    const result = await cacheService.get<unknown>('test:nonexistent');

    expect(result).toBeNull();
  });

  test('set() serializa correctamente un objeto Account complejo', async () => {
    const account: Account = {
      id: 'acc-complex-001',
      name: 'Cuenta Corriente Premium',
      type: 'checking',
      balance: 12_345.67,
      currency: 'PEN',
      iban: '1234',
    };

    await cacheService.set(cacheService.keys.accounts(), account, cacheService.TTL.accounts);
    const retrieved = await cacheService.get<Account>(cacheService.keys.accounts());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('acc-complex-001');
    expect(retrieved?.balance).toBe(12_345.67);
    expect(retrieved?.type).toBe('checking');
    expect(retrieved?.iban).toBe('1234');
    // Verificar que no perdió ningún campo
    expect(retrieved).toEqual(account);
  });
});
