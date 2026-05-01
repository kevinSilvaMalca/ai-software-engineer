/**
 * Test 3: Validación del TransferStore
 *
 * Verificamos todas las ramas del método validate() sin hacer llamadas de red.
 * El store de transferencias llama a useAccountsStore internamente para
 * verificar el saldo — lo mockeamos a nivel de módulo.
 */

// Mockear módulos nativos antes de importar el store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mockear accountsStore para controlar el saldo devuelto
jest.mock('@/stores/accountsStore', () => ({
  useAccountsStore: {
    getState: jest.fn(() => ({
      getAccountById: (id: string) => {
        if (id === 'acc-001') {
          return { id: 'acc-001', balance: 1000, currency: 'PEN' };
        }
        return undefined;
      },
    })),
  },
}));

import { useTransferStore } from '@/stores/transferStore';

// Reset del store antes de cada test
beforeEach(() => {
  useTransferStore.getState().resetTransfer();
});

describe('TransferStore — validate()', () => {
  test('cuenta origen no seleccionada → error de validación', () => {
    // Estado inicial: fromAccountId = null
    const error = useTransferStore.getState().validate();

    expect(error).not.toBeNull();
    expect(error).toMatch(/cuenta.*origen|origen/i);
  });

  test('beneficiario no seleccionado → error de validación', () => {
    useTransferStore.getState().setFormData({ fromAccountId: 'acc-001' });

    const error = useTransferStore.getState().validate();

    expect(error).not.toBeNull();
    expect(error).toMatch(/beneficiario/i);
  });

  test('monto vacío (string vacío) → error "mayor a 0"', () => {
    useTransferStore.getState().setFormData({
      fromAccountId: 'acc-001',
      beneficiaryId: 'ben-001',
      amount: '',
    });

    const error = useTransferStore.getState().validate();

    expect(error).not.toBeNull();
    expect(error).toMatch(/monto/i);
  });

  test('monto negativo (-100) → error de validación', () => {
    useTransferStore.getState().setFormData({
      fromAccountId: 'acc-001',
      beneficiaryId: 'ben-001',
      amount: '-100',
    });

    const error = useTransferStore.getState().validate();

    expect(error).not.toBeNull();
    expect(error).toMatch(/monto/i);
  });

  test('monto cero (0) → error de validación', () => {
    useTransferStore.getState().setFormData({
      fromAccountId: 'acc-001',
      beneficiaryId: 'ben-001',
      amount: '0',
    });

    const error = useTransferStore.getState().validate();

    expect(error).not.toBeNull();
    expect(error).toMatch(/monto/i);
  });

  test('todos los campos correctos y monto < saldo → validate() retorna null', () => {
    useTransferStore.getState().setFormData({
      fromAccountId: 'acc-001',
      beneficiaryId: 'ben-001',
      amount: '500', // < 1000 de saldo disponible
      currency: 'PEN',
      description: 'Pago de alquiler',
    });

    const error = useTransferStore.getState().validate();

    expect(error).toBeNull();
  });
});
