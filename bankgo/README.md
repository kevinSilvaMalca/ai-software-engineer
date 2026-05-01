# BankGo — AI Software Engineer Technical Case

> Caso técnico para **Inteligo Group** — aplicación móvil de banca personal.  
> Desarrollado con **OpenCode** + **GentleIA** como caso de uso de ingeniería asistida por IA.

[![CI](https://github.com/khack/ai-software-engineer/actions/workflows/ci.yml/badge.svg)](https://github.com/khack/ai-software-engineer/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-black?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react)
![Tests](https://img.shields.io/badge/tests-25%20passing-green?logo=jest)

---

## Descripción

BankGo es una app móvil de banca personal que demuestra:

- **Autenticación PKCE** (RFC 7636) simulada con `expo-crypto`
- **Arquitectura en capas** (Presentation → Domain → Infrastructure)
- **Estado global** con Zustand v5 (5 stores independientes)
- **Backend mock** con MSW v2 (10 endpoints REST tipados)
- **Modo offline-first** con cache TTL en AsyncStorage
- **Testing** con Jest + jest-expo (25 tests, 5 suites)
- **CI/CD** con GitHub Actions (type-check → lint → tests → build)

---

## Stack tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React Native 0.76 + Expo SDK 54 |
| Lenguaje | TypeScript strict |
| Navegación | Expo Router v4 (file-based) |
| Estado global | Zustand v5 |
| Mock backend | MSW v2 |
| Cache offline | AsyncStorage (TTL-based) |
| Tokens seguros | expo-secure-store (keychain OS) |
| Criptografía | expo-crypto (SHA-256, CSPRNG) |
| Testing | Jest 29 + jest-expo + @testing-library/react-native |
| CI/CD | GitHub Actions |

---

## Requisitos previos

- **Node.js 20+** — verificar con `node --version`
- **npm 10+** — verificar con `npm --version`
- **Expo Go** (opcional) — app en iOS/Android para preview físico
- **Emulador iOS/Android** o navegador (para `expo start --web`)

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/khack/ai-software-engineer.git
cd ai-software-engineer/bankgo
```

### 2. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` es necesario por conflictos de peer deps entre `react@19` y algunas librerías del ecosistema Expo que aún declaran `react@18` como peer dep.

### 3. Iniciar en desarrollo

```bash
# Desarrollo local (simulador/emulador en la misma máquina)
npx expo start

# Dispositivo físico con Expo Go (requiere ngrok instalado)
npm install -g @expo/ngrok@^4.1.0
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```

Opciones disponibles:
- `i` → abrir en simulador iOS
- `a` → abrir en emulador Android
- `w` → abrir en navegador (web)
- Escanear QR con Expo Go en dispositivo físico

> **Mock API**: En Expo Go (device físico) la app usa un cliente mock interno que sirve los datos del seed directamente, sin necesidad de ningún servidor externo. MSW solo se usa en tests.

### 4. Correr tests

```bash
# Tests con cobertura
npm test

# Tests en modo watch (desarrollo)
npm run test:watch
```

Output esperado: **25 tests pasando en 5 suites**.

### 5. Type check

```bash
npm run type-check
```

Ejecuta `tsc --noEmit` con configuración strict. Cero errores esperados.

### 6. Lint

```bash
# Verificar
npm run lint

# Verificar y auto-corregir
npm run lint:fix
```

### 7. Formatear código

```bash
npm run format
```

---

## Estructura del proyecto

```
bankgo/
├── app/                          # Expo Router — rutas file-based
│   ├── _layout.tsx               # Root layout: AuthGuard
│   ├── index.tsx                 # Ruta raíz → redirige a /(auth)/login
│   ├── (auth)/                   # Grupo rutas públicas (sin auth)
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Pantalla de login
│   └── (app)/                    # Grupo rutas protegidas (requieren auth)
│       ├── _layout.tsx           # Tab bar navigation
│       ├── dashboard.tsx         # Lista de cuentas
│       ├── transfer.tsx          # Wizard de transferencia (3 pasos)
│       ├── cards.tsx             # Tarjetas con toggle freeze
│       └── account/
│           └── [id].tsx          # Transacciones paginadas por cuenta
│
├── src/
│   ├── types/index.ts            # Tipos de dominio compartidos
│   ├── stores/                   # Zustand stores (Domain layer)
│   │   ├── authStore.ts          # Auth: login, logout, session restore
│   │   ├── accountsStore.ts      # Cuentas + offline-first cache
│   │   ├── transactionsStore.ts  # Transacciones paginadas + cache
│   │   ├── transferStore.ts      # Wizard: form → review → confirmed
│   │   └── cardsStore.ts         # Tarjetas + optimistic freeze
│   ├── services/                 # Infrastructure layer
│   │   ├── api/
│   │   │   ├── client.ts         # API client: devClient en device, httpClient en tests
│   │   │   ├── devClient.ts      # Mock client sin fetch (para Expo Go)
│   │   │   ├── handlers.ts       # MSW handlers (10 endpoints, solo tests)
│   │   │   ├── seed.ts           # Datos mock (usuario, cuentas, transacciones)
│   │   │   └── setup.ts          # Bootstrap MSW server (solo tests)
│   │   ├── auth/
│   │   │   ├── authService.ts    # Login / logout / restoreSession
│   │   │   ├── pkce.ts           # PKCE RFC 7636 (verifier + challenge + state)
│   │   │   └── tokenStore.ts     # In-memory token cache
│   │   └── cache/
│   │       └── cacheService.ts   # TTL cache (AsyncStorage)
│   ├── hooks/
│   │   └── useNetworkStatus.ts   # Hook de conectividad de red
│   ├── components/ui/            # Componentes UI reutilizables
│   │   ├── AccountCard.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── OfflineBanner.tsx     # Banner offline
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   └── InAppNotification.tsx # Toast de éxito/error
│   └── utils/
│       └── logger.ts             # Logger con sanitizer de tokens/PII
│
├── __tests__/                    # Tests unitarios
│   ├── services/
│   │   ├── pkce.test.ts          # PKCE: verifier, challenge, state
│   │   ├── cache.test.ts         # CacheService: TTL, get/set/remove
│   │   └── logger.test.ts        # Logger: sanitización de datos sensibles
│   └── stores/
│       ├── accountsStore.test.ts # Fetch, offline fallback, cache
│       └── transferStore.test.ts # Validación, submit, confirm, reset
│
├── docs/
│   ├── architecture.md           # Diagramas + decisiones de arquitectura
│   ├── technical-decisions.md    # 5 ADRs detallados
│   ├── ai-usage.md               # Registro de uso de IA
│   └── wireframes/
│       └── flow.md               # Wireframes ASCII del flujo completo
│
├── .github/workflows/ci.yml      # CI/CD pipeline
├── app.json                      # Configuración Expo
├── tsconfig.json                 # TypeScript strict
├── .eslintrc.js                  # ESLint config
└── package.json
```

---

## Flujo de autenticación

BankGo implementa un flujo **PKCE simulado** (RFC 7636) para demostrar buenas prácticas de seguridad en autenticación móvil:

1. **Generación de verifier**: `expo-crypto.getRandomBytes(32)` produce 32 bytes criptográficamente seguros, codificados en base64url (43 caracteres mínimo según RFC).

2. **Challenge SHA-256**: `expo-crypto.digest(SHA256, encode(verifier))` calcula el challenge — el servidor recibiría el challenge pero nunca el verifier.

3. **Login request**: `POST /auth/token` con `{ email, password, code_challenge, code_challenge_method: 'S256', state }`.

4. **Persistencia segura**: Los tokens se guardan en `expo-secure-store` (Keychain en iOS, Android Keystore en Android) — nunca en AsyncStorage ni en logs.

5. **Session restore**: Al iniciar la app, `authService.restoreSession()` lee los tokens de SecureStore, verifica `expiresAt > Date.now()`, y restaura la sesión sin re-login.

6. **Logout**: Borra todos los ítems de SecureStore y limpia `tokenStore` en memoria.

```
generateVerifier() → generateChallenge(verifier) → POST /auth/token
                                                      ↓
                                              SecureStore.setItem(tokens)
                                              tokenStore.setTokens(access, refresh)
                                                      ↓
                                              AuthGuard → redirect /dashboard
```

---

## Modo offline

La app implementa **offline-first** en dos stores:

### AccountsStore

- Fetch exitoso → guarda en `AsyncStorage` con key `bankgo:accounts` y TTL de **5 minutos**
- Fetch fallido → lee cache; si hay datos válidos, muestra con `isOffline: true`
- Sin cache → muestra `ErrorState` con botón "Reintentar"

### TransactionsStore

- Fetch exitoso → guarda en `AsyncStorage` con key `bankgo:transactions:{accountId}:{page}` y TTL de **2 minutos**
- Fetch fallido → lee cache de la misma página; si hay datos, muestra con `isOffline: true`

El componente `OfflineBanner` se renderiza cuando `isOffline: true` en cualquiera de estos stores, informando al usuario que los datos pueden no estar actualizados.

---

## CI/CD

Pipeline en `.github/workflows/ci.yml` con dos jobs:

### Job 1: Quality Checks (bloquea merge si falla)

```
checkout → setup Node 20 → npm ci → tsc --noEmit → eslint → jest --coverage
```

- **Type check**: TypeScript strict, cero errores
- **Lint**: ESLint con config de Expo
- **Tests**: 25 tests en 5 suites con cobertura (artefacto `coverage-report`)

### Job 2: Expo Build Check (depende del Job 1)

```
checkout → setup Node 20 → npm ci → expo export --platform web
```

Verifica que el bundle de producción compila sin errores.

**Triggers**: Push y Pull Requests a `main` y `develop`.

---

## Documentación adicional

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/architecture.md) | Diagramas Mermaid de capas, auth flow y data flow. Decisiones clave y OWASP. |
| [Decisiones técnicas](docs/technical-decisions.md) | 5 ADRs: Expo, Zustand, MSW, AsyncStorage/SecureStore, expo-crypto |
| [Wireframes](docs/wireframes/flow.md) | Wireframes ASCII de todas las pantallas y estados |
| [Uso de IA](docs/ai-usage.md) | Registro de cómo se usó OpenCode + GentleIA en el desarrollo |

---

## Credenciales de prueba

El backend es un mock (MSW) — acepta cualquier combinación válida de formato:

| Campo | Valor |
|-------|-------|
| Email | `maria.garcia@example.com` |
| Contraseña | Cualquier valor de 4+ caracteres |

> El mock no valida credenciales reales — autentica cualquier request a `POST /auth/token`. El comportamiento simulado incluye latencia realista (200-400ms) para que los loading states sean visibles.

---

## Variables de entorno

```bash
# .env.local — copiar desde .env.example
EXPO_PUBLIC_API_BASE_URL=   # vacío en desarrollo (devClient no usa fetch)
```

**En tests**: `apiClient` usa el cliente HTTP real + MSW intercepta `fetch()`.  
**En Expo Go (device)**: `apiClient` usa `devClient` que sirve datos del seed directamente, sin ninguna llamada de red. No se necesita servidor externo ni URL base.

---

## Troubleshooting

### `npm install` falla con peer dep errors

```bash
npm install --legacy-peer-deps
```

### Los tests fallan con "Cannot find module 'msw/node'"

Verificar `moduleNameMapper` en `package.json`:
```json
"^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js"
```

### Expo Go no muestra cambios

```bash
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```

### `TypeError: fetch failed` al iniciar con `--tunnel`

El CLI de Expo intenta validar versiones contra `api.expo.dev`. Si no hay conexión, usar:
```bash
EXPO_OFFLINE=1 npx expo start --tunnel --clear
```

### ngrok no instalado

```bash
npm install -g @expo/ngrok@^4.1.0
```

### TypeScript errors en `__DEV__`

`__DEV__` es una variable global de React Native declarada en el tipo global. Si el editor no la reconoce, verificar `tsconfig.json` incluye `"types": ["react-native"]`.
