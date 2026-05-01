# BankGo — AI Software Engineer Technical Case

> Caso técnico para **Inteligo Group** — aplicación móvil de banca personal.  
> Desarrollado con **OpenCode** + **GentleIA** como caso de uso de ingeniería asistida por IA.

[![CI](https://github.com/kevinSilvaMalca/ai-software-engineer/actions/workflows/ci.yml/badge.svg)](https://github.com/kevinSilvaMalca/ai-software-engineer/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-black?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react)
![Tests](https://img.shields.io/badge/tests-25%20passing-green?logo=jest)

---

## ¿Qué es BankGo?

BankGo es una aplicación móvil de banca personal construida con React Native y Expo. Simula las funcionalidades principales de una app bancaria real:

- **Login seguro** con autenticación PKCE (estándar RFC 7636 usado en apps móviles reales)
- **Dashboard** con listado de cuentas y balances
- **Transacciones** paginadas por cuenta
- **Transferencias** con flujo de 3 pasos (formulario → revisión → confirmación)
- **Tarjetas** con opción de congelar/descongelar
- **Modo offline** — la app muestra datos cacheados cuando no hay red

No necesita ningún servidor externo. Todos los datos son mock: se generan localmente en el código.

---

## Cómo funciona por dentro

### El problema que resuelve cada capa

```
┌─────────────────────────────────────────────────┐
│  PANTALLAS (app/)                               │
│  Lo que el usuario ve y toca                    │
│  login.tsx, dashboard.tsx, cards.tsx, etc.      │
└───────────────────┬─────────────────────────────┘
                    │ llaman a
┌───────────────────▼─────────────────────────────┐
│  STORES (src/stores/)                           │
│  El estado global de la app — Zustand v5        │
│  authStore, accountsStore, cardsStore, etc.     │
└───────────────────┬─────────────────────────────┘
                    │ usan
┌───────────────────▼─────────────────────────────┐
│  SERVICIOS (src/services/)                      │
│  Comunicación con APIs, tokens, cache           │
│  apiClient, authService, cacheService           │
└─────────────────────────────────────────────────┘
```

### El flujo de arranque paso a paso

Cuando abrís la app en el celular, esto es lo que pasa:

```
1. index.ts
   └─ importa expo-router/entry

2. app/_layout.tsx monta
   └─ isLoading = true (el store arranca en true, bloquea cualquier redirección prematura)
   └─ llama initialize() → lee SecureStore
       ├─ Si hay tokens válidos → isAuthenticated = true → muestra el Stack de pantallas
       └─ Si no hay tokens    → isAuthenticated = false → <Redirect href="/(auth)/login" />

3. app/(auth)/login.tsx
   └─ usuario ingresa email + contraseña
   └─ login() → genera PKCE (verifier + challenge) → POST /auth/token (mock)
   └─ guarda tokens en SecureStore (Keychain iOS / Android Keystore)
   └─ isAuthenticated = true → AuthGuard redirige a /(app)/dashboard

4. app/(app)/dashboard.tsx
   └─ fetchAccounts() → GET /accounts (mock)
   └─ guarda en AsyncStorage con TTL 5 minutos
   └─ muestra lista de cuentas
```

### Por qué los datos no necesitan servidor

La app tiene dos modos de cliente API:

| Entorno | Cliente usado | Cómo funciona |
|---------|---------------|---------------|
| **Expo Go / device** | `devClient.ts` | Retorna datos del seed directamente. Sin fetch, sin red. |
| **Tests (Jest)** | `httpApiClient` + MSW | Fetch real interceptado por MSW con los mismos handlers. |

Esto significa que podés abrir la app en tu celular sin configurar nada y ya tenés datos reales de ejemplo.

---

## Instalación

### Requisitos

- **Node.js 20+** — `node --version`
- **npm 10+** — `npm --version`
- **Expo Go 54** en tu celular (App Store / Play Store) — o emulador Android/iOS

### Pasos

```bash
# 1. Clonar
git clone https://github.com/kevinSilvaMalca/ai-software-engineer.git
cd ai-software-engineer/bankgo

# 2. Instalar dependencias
npm install --legacy-peer-deps
```

> **¿Por qué `--legacy-peer-deps`?** Algunas librerías del ecosistema Expo declaran `react@18` como peer dep pero el proyecto usa la versión correcta para RN 0.76. El flag ignora ese conflicto de declaración sin romper nada.

---

## Cómo correr la app

### Opción A — Emulador Android (recomendado, ves los logs)

```bash
# Instalar Android Studio primero: https://developer.android.com/studio
# Crear un AVD (Pixel 7, API 34) desde Virtual Device Manager
# Arrancar el emulador, luego:

npx expo start --android
```

### Opción B — Dispositivo físico con Expo Go

```bash
# Instalar ngrok (solo la primera vez)
npm install -g @expo/ngrok@^4.1.0

# Arrancar con tunnel
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```

Escaneá el QR con la cámara (iOS) o con la app Expo Go (Android).

> **`EXPO_OFFLINE=1`** evita que el CLI de Expo intente validar versiones contra internet — en algunas redes falla y bloquea el arranque.

### Opción C — Navegador web

```bash
npx expo start --web
```

---

## Credenciales de prueba

| Campo | Valor |
|-------|-------|
| Email | `maria.garcia@example.com` |
| Contraseña | cualquier texto de 4+ caracteres |

El mock acepta cualquier combinación. No valida credenciales reales.

---

## Tests

```bash
# Correr todos los tests con cobertura
npm test

# Modo watch (se re-ejecutan al guardar)
npm run test:watch
```

**25 tests en 5 suites** — todos deben pasar.

Los tests cubren:
- `pkce.test.ts` — generación de verifier, challenge y state (RFC 7636)
- `cache.test.ts` — TTL, get/set/remove en AsyncStorage
- `logger.test.ts` — sanitización de tokens y datos sensibles en logs
- `accountsStore.test.ts` — fetch de cuentas, fallback offline, cache
- `transferStore.test.ts` — validación, submit, confirm, reset del wizard

---

## Otros comandos

```bash
# Verificar tipos TypeScript (cero errores esperados)
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Formatear con Prettier
npm run format
```

---

## Estructura del proyecto

```
bankgo/
├── app/                          # Rutas de la app (Expo Router — file-based)
│   ├── _layout.tsx               # Layout raíz: spinner de carga + guard de auth
│   ├── index.tsx                 # Ruta "/" → redirige a login
│   ├── (auth)/                   # Rutas públicas (sin sesión)
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Pantalla de login
│   └── (app)/                    # Rutas protegidas (requieren sesión)
│       ├── _layout.tsx           # Navegación por tabs
│       ├── dashboard.tsx         # Lista de cuentas con balances
│       ├── transfer.tsx          # Transferencias (3 pasos)
│       ├── cards.tsx             # Tarjetas con freeze/unfreeze
│       └── account/
│           └── [id].tsx          # Transacciones paginadas por cuenta
│
├── src/
│   ├── types/index.ts            # Tipos de dominio (User, Account, Card, etc.)
│   ├── stores/                   # Estado global — Zustand v5
│   │   ├── authStore.ts          # Sesión: login, logout, initialize
│   │   ├── accountsStore.ts      # Cuentas con cache offline (TTL 5 min)
│   │   ├── transactionsStore.ts  # Transacciones paginadas con cache (TTL 2 min)
│   │   ├── transferStore.ts      # Wizard de transferencia
│   │   └── cardsStore.ts         # Tarjetas con optimistic update en freeze
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts         # Exporta devClient (device) o httpClient (tests)
│   │   │   ├── devClient.ts      # Mock sin fetch — sirve seed data directamente
│   │   │   ├── handlers.ts       # MSW handlers — solo para tests
│   │   │   ├── seed.ts           # Datos mock: cuentas, transacciones, tarjetas
│   │   │   └── setup.ts          # Bootstrap MSW — solo para tests
│   │   ├── auth/
│   │   │   ├── authService.ts    # login / logout / restoreSession
│   │   │   ├── pkce.ts           # PKCE RFC 7636
│   │   │   └── tokenStore.ts     # Tokens en memoria (limpiados en logout)
│   │   └── cache/
│   │       └── cacheService.ts   # Cache con TTL sobre AsyncStorage
│   ├── hooks/
│   │   └── useNetworkStatus.ts   # Detecta si hay red disponible
│   ├── components/ui/            # Componentes reutilizables
│   │   ├── AccountCard.tsx       # Tarjeta de cuenta con balance
│   │   ├── TransactionItem.tsx   # Ítem de transacción
│   │   ├── OfflineBanner.tsx     # Banner "sin conexión"
│   │   ├── EmptyState.tsx        # Pantalla vacía genérica
│   │   ├── ErrorState.tsx        # Pantalla de error con retry
│   │   ├── LoadingState.tsx      # Spinner de carga
│   │   ├── ConfirmationDialog.tsx# Diálogo de confirmación
│   │   └── InAppNotification.tsx # Toast de éxito/error
│   └── utils/
│       └── logger.ts             # Logger que nunca imprime tokens ni PII
│
├── __tests__/                    # Tests unitarios
│   ├── services/
│   │   ├── pkce.test.ts
│   │   ├── cache.test.ts
│   │   └── logger.test.ts
│   └── stores/
│       ├── accountsStore.test.ts
│       └── transferStore.test.ts
│
├── __mocks__/
│   ├── msw-node-stub.js          # Stub de msw/node para Metro (no corre en device)
│   └── NativeModules.js          # Mock de módulos nativos para Jest
│
├── docs/                         # Documentación técnica
│   ├── architecture.md           # Diagramas de arquitectura
│   ├── technical-decisions.md    # ADRs (decisiones técnicas)
│   ├── ai-usage.md               # Registro de uso de IA
│   └── wireframes/flow.md        # Wireframes de todas las pantallas
│
├── .github/workflows/ci.yml      # CI: type-check → lint → tests → build
├── app.json                      # Config de Expo (SDK, scheme, orientación)
├── metro.config.js               # Stub de msw/node en el bundler
├── tsconfig.json                 # TypeScript strict
├── jest.setup.js                 # Setup global de tests
└── package.json
```

---

## Autenticación PKCE — cómo funciona

PKCE (Proof Key for Code Exchange, RFC 7636) es el estándar de seguridad para autenticación en apps móviles. Protege contra ataques de intercepción del código de autorización.

**Flujo implementado:**

```
1. generateCodeVerifier()
   └─ 32 bytes random de expo-crypto.getRandomBytes()
   └─ codificados en base64url → string de 43 chars

2. generateCodeChallenge(verifier)
   └─ SHA-256 del verifier via expo-crypto.digest()
   └─ codificado en base64url

3. POST /auth/token { email, password, code_challenge, method: 'S256' }
   └─ el servidor (mock) devuelve { access_token, refresh_token, expires_in }

4. Tokens guardados en SecureStore
   └─ iOS: Keychain Services
   └─ Android: Android Keystore
   └─ NUNCA en AsyncStorage ni en logs

5. Al reabrir la app:
   └─ restoreSession() lee tokens de SecureStore
   └─ verifica que expiresAt > ahora
   └─ si son válidos: sesión restaurada sin re-login
```

---

## Modo offline

Las cuentas y transacciones tienen cache con TTL en AsyncStorage:

| Dato | TTL | Clave |
|------|-----|-------|
| Cuentas | 5 minutos | `bankgo:accounts` |
| Transacciones | 2 minutos | `bankgo:transactions:{accountId}:{page}` |

**Comportamiento cuando no hay red:**
1. El fetch falla
2. Se intenta leer el cache
3. Si hay cache válido → muestra datos con banner "Sin conexión"
4. Si no hay cache → muestra pantalla de error con botón "Reintentar"

---

## CI/CD

Pipeline en `.github/workflows/ci.yml` que se ejecuta en cada push a `main` o `develop`:

```
Job 1 — Quality
  npm ci → tsc --noEmit → eslint → jest --coverage

Job 2 — Build (depende de Job 1)
  npm ci → expo export --platform web
```

---

## Troubleshooting

### `npm install` falla con errores de peer deps
```bash
npm install --legacy-peer-deps
```

### La app abre pero queda en pantalla blanca
```bash
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```
Si sigue fallando, usá el emulador Android para ver los logs:
```bash
npx expo start --android
```

### `TypeError: fetch failed` al iniciar
```bash
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```

### ngrok no encontrado
```bash
npm install -g @expo/ngrok@^4.1.0
```

### Los tests fallan con "Cannot find module"
Verificar que `package.json` tenga el `moduleNameMapper` correcto y correr:
```bash
npm install --legacy-peer-deps
npm test
```
