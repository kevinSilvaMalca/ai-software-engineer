/**
 * devClient — Mock API client para desarrollo en device.
 *
 * En Expo Go no corre ningún servidor HTTP local, así que MSW (msw/node)
 * no puede interceptar fetch. Este módulo reemplaza el apiClient cuando
 * __DEV__ es true, sirviendo los mismos datos que los handlers de MSW
 * pero sin ninguna llamada de red.
 *
 * NUNCA importar en tests — los tests usan el apiClient real + MSW.
 */

import type {
  Transfer,
  TransferRequest,
} from '@/types/index';
import {
  seedUser,
  seedAccounts,
  seedTransactions,
  seedCards,
  seedBeneficiaries,
} from './seed';

// ---------------------------------------------------------------------------
// In-memory mutable state (se resetea al recargar el bundle)
// ---------------------------------------------------------------------------

const MOCK_ACCESS_TOKEN = 'mock-access-token-abc123';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-xyz789';

let _cardStore = seedCards.map((c) => ({ ...c }));
const _transferStore = new Map<string, Transfer>();
let _transferCounter = 1;

function fakeDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Rutas mock
// ---------------------------------------------------------------------------

async function handleRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  // POST /auth/token
  if (method === 'POST' && path === '/auth/token') {
    await fakeDelay(300);
    return {
      access_token: MOCK_ACCESS_TOKEN,
      refresh_token: MOCK_REFRESH_TOKEN,
      token_type: 'Bearer',
      expires_in: 3600,
    } as T;
  }

  // GET /auth/me
  if (method === 'GET' && path === '/auth/me') {
    await fakeDelay(200);
    return seedUser as T;
  }

  // GET /accounts
  if (method === 'GET' && path === '/accounts') {
    await fakeDelay(300);
    return seedAccounts as T;
  }

  // GET /accounts/:id — e.g. /accounts/acc-001
  const accountMatch = path.match(/^\/accounts\/([^/]+)$/);
  if (method === 'GET' && accountMatch) {
    await fakeDelay(200);
    const account = seedAccounts.find((a) => a.id === accountMatch[1]);
    if (!account) throw new Error(`Account ${accountMatch[1]} not found`);
    return account as T;
  }

  // GET /accounts/:id/transactions?page=1&limit=20
  const txMatch = path.match(/^\/accounts\/([^/]+)\/transactions(\?.*)?$/);
  if (method === 'GET' && txMatch) {
    await fakeDelay(300);
    const accountId = txMatch[1]!;
    const qs = txMatch[2] ?? '';
    const params = new URLSearchParams(qs.replace('?', ''));
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '20', 10)));

    const allTx = seedTransactions
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = allTx.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = allTx.slice(start, start + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages },
    } as T;
  }

  // POST /transfers
  if (method === 'POST' && path === '/transfers') {
    await fakeDelay(700);
    const req = body as TransferRequest;
    if (!req.fromAccountId || !req.beneficiaryId || !req.amount || req.amount <= 0) {
      throw new Error('Missing or invalid transfer fields');
    }
    const fromAccount = seedAccounts.find((a) => a.id === req.fromAccountId);
    if (!fromAccount) throw new Error(`Account ${req.fromAccountId} not found`);
    const beneficiary = seedBeneficiaries.find((b) => b.id === req.beneficiaryId);
    if (!beneficiary) throw new Error(`Beneficiary ${req.beneficiaryId} not found`);

    const transfer: Transfer = {
      id: `tr-${String(_transferCounter++).padStart(4, '0')}`,
      fromAccountId: req.fromAccountId,
      beneficiaryId: req.beneficiaryId,
      amount: req.amount,
      currency: req.currency ?? fromAccount.currency,
      description: req.description ?? '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    _transferStore.set(transfer.id, transfer);
    return transfer as T;
  }

  // POST /transfers/:id/confirm
  const confirmMatch = path.match(/^\/transfers\/([^/]+)\/confirm$/);
  if (method === 'POST' && confirmMatch) {
    await fakeDelay(1200);
    const transfer = _transferStore.get(confirmMatch[1]!);
    if (!transfer) throw new Error(`Transfer ${confirmMatch[1]} not found`);
    if (transfer.status !== 'pending') {
      throw new Error(`Transfer is already ${transfer.status}`);
    }
    const confirmed: Transfer = { ...transfer, status: 'confirmed' };
    _transferStore.set(confirmed.id, confirmed);
    return confirmed as T;
  }

  // GET /cards
  if (method === 'GET' && path === '/cards') {
    await fakeDelay(300);
    return _cardStore as T;
  }

  // PATCH /cards/:id
  const cardMatch = path.match(/^\/cards\/([^/]+)$/);
  if (method === 'PATCH' && cardMatch) {
    await fakeDelay(300);
    const idx = _cardStore.findIndex((c) => c.id === cardMatch[1]);
    if (idx === -1) throw new Error(`Card ${cardMatch[1]} not found`);
    _cardStore = _cardStore.map((c, i) => (i === idx ? { ...c, frozen: !c.frozen } : c));
    return _cardStore[idx] as T;
  }

  throw new Error(`[devClient] Unhandled route: ${method} ${path}`);
}

// ---------------------------------------------------------------------------
// API pública — misma interfaz que apiClient
// ---------------------------------------------------------------------------

export const devApiClient = {
  get<T>(path: string): Promise<T> {
    return handleRequest<T>('GET', path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return handleRequest<T>('POST', path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return handleRequest<T>('PATCH', path, body);
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return handleRequest<T>('PUT', path, body);
  },
  delete<T>(path: string): Promise<T> {
    return handleRequest<T>('DELETE', path);
  },
};
