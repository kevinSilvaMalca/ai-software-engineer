/**
 * Test 5: AccountsStore — Offline fallback
 *
 * Verificamos el comportamiento del store cuando:
 * 1. La red funciona → carga accounts, isOffline: false, cache escrito
 * 2. La red falla + hay cache → accounts del cache, isOffline: true
 * 3. La red falla + SIN cache → error message, accounts vacío
 * 4. Fetch exitoso → cache fue escrito (verificar con cacheService.get)
 *
 * Mockeamos apiClient directamente para evitar la complejidad de MSW con
 * rettime (ESM-only) en el entorno jest-expo que solo transforma [jt]sx?.
 * El comportamiento de red es un detalle de implementación del store —
 * lo que testeamos son las transiciones de estado y el fallback offline.
 *
 * NOTA: jest.mock() es elevado por Babel — variables prefijadas con "mock"
 * (case insensitive) son permitidas dentro del factory.
 */

import type { Account } from '@/types/index';

// ---------------------------------------------------------------------------
// Mock AsyncStorage en memoria
// ---------------------------------------------------------------------------

const mockAsyncStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(mockAsyncStorage.get(key) ?? null),
  ),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockAsyncStorage.delete(key);
    return Promise.resolve();
  }),
}));

// Mock de expo-secure-store (nativo)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock del apiClient para controlar las respuestas de red
jest.mock('@/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ApiRequestError: class ApiRequestError extends Error {
    code: string;
    httpStatus: number;
    constructor(apiError: { code: string; message: string }, httpStatus: number) {
      super(apiError.message);
      this.name = 'ApiRequestError';
      this.code = apiError.code;
      this.httpStatus = httpStatus;
    }
  },
}));

// ---------------------------------------------------------------------------
// Importar DESPUÉS de los mocks
// ---------------------------------------------------------------------------

import { useAccountsStore } from '@/stores/accountsStore';
import { cacheService } from '@/services/cache/cacheService';
import { apiClient } from '@/services/api/client';

const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc-001',
    name: 'Cuenta Corriente',
    type: 'checking',
    balance: 15_480.5,
    currency: 'PEN',
    iban: '3271',
  },
  {
    id: 'acc-002',
    name: 'Cuenta de Ahorros',
    type: 'savings',
    balance: 45_220.0,
    currency: 'PEN',
    iban: '8844',
  },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockAsyncStorage.clear();
  mockApiGet.mockReset();
  useAccountsStore.setState({
    accounts: [],
    isLoading: false,
    error: null,
    isOffline: false,
    lastFetched: null,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('accountsStore — offline fallback', () => {
  test('fetchAccounts() exitoso → accounts disponibles, isOffline: false', async () => {
    mockApiGet.mockResolvedValueOnce(MOCK_ACCOUNTS);

    await useAccountsStore.getState().fetchAccounts();

    const state = useAccountsStore.getState();
    expect(state.isOffline).toBe(false);
    expect(state.error).toBeNull();
    expect(state.accounts).toHaveLength(2);
    expect(state.accounts[0]?.id).toBe('acc-001');
    expect(state.lastFetched).not.toBeNull();
  });

  test('fetchAccounts() exitoso → cache fue escrito (verificar con cacheService.get)', async () => {
    mockApiGet.mockResolvedValueOnce(MOCK_ACCOUNTS);

    await useAccountsStore.getState().fetchAccounts();

    // El cache debe existir y contener los datos correctos
    const cached = await cacheService.get<Account[]>(cacheService.keys.accounts());
    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(2);
    expect(cached![0]?.id).toBe('acc-001');
    expect(cached![1]?.id).toBe('acc-002');
  });

  test('fetchAccounts() con red caída + cache disponible → accounts del cache, isOffline: true', async () => {
    // Precargar el cache con datos conocidos
    await cacheService.set(
      cacheService.keys.accounts(),
      MOCK_ACCOUNTS,
      cacheService.TTL.accounts,
    );

    // Simular error de red
    mockApiGet.mockRejectedValueOnce(new Error('Network request failed'));

    await useAccountsStore.getState().fetchAccounts();

    const state = useAccountsStore.getState();
    expect(state.isOffline).toBe(true);
    // Sin error porque el cache salvó la situación
    expect(state.error).toBeNull();
    expect(state.accounts).toHaveLength(2);
    expect(state.accounts[0]?.id).toBe('acc-001');
  });

  test('fetchAccounts() con red caída + SIN cache → error message, accounts vacío', async () => {
    // Cache vacío (mockAsyncStorage está limpio por beforeEach)
    mockApiGet.mockRejectedValueOnce(new Error('Network request failed'));

    await useAccountsStore.getState().fetchAccounts();

    const state = useAccountsStore.getState();
    expect(state.isOffline).toBe(true);
    expect(state.accounts).toHaveLength(0);
    expect(state.error).not.toBeNull();
    // El mensaje exacto del store
    expect(state.error).toBe('No hay conexión y no hay datos cacheados');
  });
});
