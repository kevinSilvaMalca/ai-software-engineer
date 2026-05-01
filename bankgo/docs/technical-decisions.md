# BankGo — Architecture Decision Records (ADRs)

> Formato basado en [Michael Nygard's ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).  
> Última actualización: 2026-04-30

---

## ADR-001: React Native + Expo sobre Flutter o nativo puro

**Fecha**: 2026-04-30  
**Estado**: Aceptado

### Contexto

Se necesita una app móvil de banca personal funcional como caso técnico. Los criterios principales son: velocidad de desarrollo, ecosistema TypeScript, capacidad de demostrar testing y arquitectura, y cobertura de iOS + Android con un solo codebase. Las alternativas evaluadas fueron Flutter (Dart, single codebase) y nativo puro (Swift/Kotlin, dos codebases).

### Decisión

React Native 0.81 con Expo SDK 54. Expo agrega managed workflow, módulos nativos pre-compilados (`expo-crypto`, `expo-secure-store`) y Expo Router para file-based navigation. TypeScript strict en toda la codebase.

### Consecuencias positivas

- **TypeScript end-to-end**: mismo lenguaje en dominio, servicios, tests y scripts. Los tipos se comparten entre capas sin conversión.
- **Expo managed modules**: `expo-crypto` (PKCE), `expo-secure-store` (keychain), `expo-router` (navigation) sin configurar Gradle ni CocoaPods manualmente.
- **Ecosistema de testing maduro**: jest-expo + @testing-library/react-native permiten tests unitarios de stores y de componentes con las mismas herramientas que en web.
- **MSW v2 funciona directamente**: MSW intercepta `fetch()` tanto en el emulador como en jest sin configuración adicional.
- **Hot reload + Expo Go**: iteración rápida durante desarrollo sin compilar.

### Consecuencias negativas / trade-offs

- **Performance en casos extremos**: React Native tiene overhead de bridge JS↔Native (nuevo Architecture con JSI lo reduce, pero Expo SDK 54 no lo habilita por defecto en todos los módulos). Para listas de transacciones largas, `FlashList` sería más eficiente que `FlatList`.
- **Expo managed ≠ acceso a todo el API nativo**: módulos nativos personalizados (e.g., certificate pinning con TrustKit) requieren "eject" a bare workflow o EAS Build con plugins de config.
- **Bundle size mayor que Flutter**: la librería de runtime JS agrega ~6MB comprimidos al APK/IPA.
- **Dart vs TypeScript**: Flutter tiene hot reload más fluido en algunos escenarios y un widget system más predecible. Para un equipo ya en TypeScript, React Native es más natural.

---

## ADR-002: Zustand sobre Redux Toolkit o Context API

**Fecha**: 2026-04-30  
**Estado**: Aceptado

### Contexto

La app necesita estado global compartido entre pantallas: sesión de usuario, lista de cuentas, transacciones paginadas, wizard de transferencia en 3 pasos, y tarjetas con toggle optimista. Se evaluaron Context API (nativo de React), Redux Toolkit (estándar de la industria) y Zustand v5 (librería minimalista).

### Decisión

Zustand v5 con un store por dominio (authStore, accountsStore, transactionsStore, transferStore, cardsStore). Cada store encapsula estado + acciones en un único `create<State>()`. No hay dispatch, no hay reducers, no hay Provider en el root.

### Consecuencias positivas

- **Cero boilerplate**: un store de Zustand equivale a un slice de Redux Toolkit + actions + selectors + Provider, pero en ~40 líneas vs ~120. Esto acelera el desarrollo y hace el código más legible.
- **Re-renders selectivos**: `useStore(s => s.field)` suscribe solo al campo necesario. Context API re-renderiza todo el árbol de consumidores cuando cualquier valor del contexto cambia.
- **Acceso fuera de React**: `useTransferStore.getState()` permite acceder al estado desde servicios o desde otro store (ej: `transferStore.validate()` accede a `accountsStore` directamente). En Redux esto requeriría `store.dispatch` desde fuera.
- **TypeScript first**: `create<State>()` infiere tipos automáticamente sin `PayloadAction<>` ni `ReturnType<typeof slice.actions>`.
- **Testing trivial**: resetear un store en tests es `useStore.setState(initialState)`. No hay mocking de dispatch ni de reducers.

### Consecuencias negativas / trade-offs

- **Sin Redux DevTools nativo**: Zustand tiene un middleware `devtools` para Redux DevTools Extension, pero requiere configuración manual. Redux Toolkit lo incluye by default.
- **Sin time-travel debugging out-of-the-box**: Redux DevTools permite retroceder acciones. En Zustand es posible con el middleware `subscribeWithSelector` + logging manual.
- **Menos convenciones de equipo**: Redux impone estructura rígida (slices, thunks, selectors) que facilita onboarding en equipos grandes. Zustand es más libre — el equipo debe acordar convenciones (como las que usamos: un store por dominio, acciones async en el store).
- **Sin middleware de efectos declarativo**: sagas/observables para flujos complejos no existen en Zustand. Para este caso, las acciones async directas son suficientes.

---

## ADR-003: MSW v2 como backend mock sobre JSON Server o Axios Mock Adapter

**Fecha**: 2026-04-30  
**Estado**: Aceptado

### Contexto

La app necesita un backend mock que simule autenticación PKCE, CRUD de cuentas, transacciones paginadas, transferencias en dos pasos (POST + confirm), y toggle de tarjetas. El mock debe funcionar tanto en tiempo de ejecución (desarrollo en emulador) como en tests (jest). Las alternativas evaluadas: JSON Server (proceso externo REST), Axios Mock Adapter (mock de la librería HTTP), y MSW v2.

### Decisión

MSW v2 (`msw@^2.14.2`) con handlers tipados en TypeScript. Los handlers usan los mismos tipos del dominio (`Transfer`, `TokenResponse`, etc.). El servidor MSW se inicializa en `_layout.tsx` cuando `NODE_ENV === 'test'`, y en `App.tsx` como Service Worker para desarrollo en browser.

### Consecuencias positivas

- **Un solo código para dev y test**: los mismos `handlers.ts` se usan en jest (via `setupServer()` de `msw/node`) y en Expo Go (via Service Worker). No hay que mantener dos sets de mocks.
- **Intercepta `fetch()` real**: el `apiClient` usa `fetch()` nativo. MSW lo intercepta a nivel de red — los tests ejercitan el mismo código que producción, incluyendo headers, parsing JSON y manejo de errores.
- **TypeScript end-to-end**: los handlers retornan `HttpResponse.json(typed_value)`. Si el tipo de `Transfer` cambia, el handler falla en compilación.
- **Latencia simulada**: `delay(200)`, `delay(600)`, `delay(1200)` en los handlers hacen la experiencia de desarrollo más realista y permiten probar loading states.
- **Stateful mock sin proceso externo**: `transferStore` (in-memory Map) en los handlers mantiene estado entre requests sin necesitar una DB o servidor HTTP separado.

### Consecuencias negativas / trade-offs

- **No hay persistencia**: el estado del mock (transfers creados, tarjetas congeladas) se pierde cuando MSW reinicia. Para demo de larga duración, JSON Server con un `db.json` ofrece persistencia.
- **Service Worker solo en browser**: MSW en React Native requiere el modo `node` (interceptor de `node:http`). En Expo Go en un dispositivo físico, el Service Worker no funciona — se necesita la versión `react-native` de MSW que usa interceptors de XHR/fetch a nivel de JS. Esto está workaroundeado con el setup en `_layout.tsx`.
- **Curva de aprendizaje de MSW v2**: la API cambió significativamente entre v1 y v2 (`rest.get` → `http.get`, `ctx.json` → `HttpResponse.json`). La documentación de v2 no siempre está sincronizada con ejemplos de la comunidad.
- **No reemplaza tests de integración real**: MSW no prueba el backend real. Los tests de integración contra un servidor real siguen siendo necesarios en producción.

---

## ADR-004: Separación de AsyncStorage (cache) y SecureStore (tokens)

**Fecha**: 2026-04-30  
**Estado**: Aceptado

### Contexto

La app necesita dos tipos de almacenamiento persistente: tokens de autenticación (access + refresh) y datos de negocio cacheados (cuentas, transacciones). La pregunta es si usar un único storage o dos mecanismos diferenciados por threat model.

### Decisión

Separación estricta por sensibilidad:

- **`expo-secure-store`** → tokens únicamente (`bankgo.access_token`, `bankgo.refresh_token`, `bankgo.expires_at`)
- **`@react-native-async-storage/async-storage`** → cache de datos de negocio (`bankgo:accounts`, `bankgo:transactions:id:page`)

### Consecuencias positivas

- **Threat model correcto**: SecureStore usa Keychain Services (iOS) y Android Keystore — cifrado con clave derivada del hardware, protegida por biometría opcional. AsyncStorage es un SQLite plano en el directorio de la app — legible si el dispositivo está rooteado.
- **Principio de menor privilegio**: los datos de cuentas y transacciones en AsyncStorage no son credenciales de acceso. Si se comprometen, el atacante ve saldos históricos pero no puede autenticar requests sin el token.
- **TTL de cache sin complejidad**: `cacheService` maneja `expiresAt` con `Date.now()` — no necesita las APIs de SecureStore que son async y con overhead de biometría.
- **Separación de responsabilidades**: `authService` es el único módulo que toca SecureStore. `cacheService` es el único que toca AsyncStorage. No hay acoplamiento entre ellos.
- **Fácil de auditar**: buscar `SecureStore` en el código muestra exactamente qué se almacena de forma segura.

### Consecuencias negativas / trade-offs

- **AsyncStorage no está cifrado**: en un dispositivo rooteado o con backup habilitado en Android, los datos de AsyncStorage son legibles. Para saldos financieros en producción, se debería cifrar el cache (ej: react-native-mmkv con encriptación).
- **Dos APIs diferentes**: el código de acceso a storage usa dos interfaces distintas. `cacheService` abstrae AsyncStorage; `authService` usa SecureStore directamente. Si el equipo no es cuidadoso, alguien podría usar AsyncStorage para datos sensibles por conveniencia.
- **SecureStore tiene límite de tamaño**: en iOS, Keychain tiene límite de ~4KB por ítem. Los tokens JWT generalmente caben, pero si el token payload es grande (claims de permisos extensos), puede fallar silenciosamente.
- **Performance**: SecureStore es más lento que AsyncStorage por el overhead criptográfico. En el flujo de login, se hacen 3 writes a SecureStore — aceptable dado que es una operación infrecuente.

---

## ADR-005: expo-crypto para PKCE sobre implementación manual de SHA-256

**Fecha**: 2026-04-30  
**Estado**: Aceptado

### Contexto

PKCE (RFC 7636) requiere: (1) generar un `code_verifier` con bytes aleatorios criptográficamente seguros, (2) calcular `SHA-256(verifier)` y codificarlo en base64url. Las alternativas evaluadas: implementación manual con `Math.random()` + librería JS de SHA-256, Web Crypto API (`crypto.subtle`), y `expo-crypto`.

### Decisión

`expo-crypto` para ambas operaciones: `Crypto.getRandomBytes(n)` para el verifier y `Crypto.digest(SHA256, data)` para el challenge.

### Consecuencias positivas

- **Criptográficamente seguro**: `expo-crypto.getRandomBytes()` usa `SecRandomCopyBytes` en iOS y `SecureRandom` en Android — generadores de números aleatorios del sistema operativo diseñados para uso criptográfico. `Math.random()` no es criptográficamente seguro.
- **SHA-256 nativo**: `Crypto.digest()` usa la implementación nativa del OS (CommonCrypto en iOS, Java Security en Android). No hay dependencia de librerías JS de crypto que pueden tener vulnerabilidades propias o timing attacks.
- **Ya en el stack de Expo**: `expo-crypto` es un módulo oficial del ecosistema Expo, ya instalado para el SDK. No agrega una dependencia nueva al bundle.
- **API simple y tipada**: `CryptoDigestAlgorithm.SHA256` es un enum — no hay strings mágicos. La función `digest()` retorna `Promise<ArrayBuffer>` — compatible con `TextEncoder` y `Uint8Array` sin conversión rara.
- **Consistencia con SecureStore**: ambos son módulos de Expo que delegan al keychain/sistema nativo. El threat model es coherente.

### Consecuencias negativas / trade-offs

- **`expo-crypto` no funciona en Node.js puro**: en el entorno de jest, el módulo necesita ser mockeado. El mock de `expo-crypto` en tests retorna bytes predecibles — lo que es aceptable en tests pero debe documentarse para evitar que el mock se use en producción.
- **`crypto.subtle` hubiera funcionado también**: la Web Crypto API está disponible en React Native 0.74+ y es estándar W3C. La diferencia real es mínima — `expo-crypto` es más ergonómico para el ecosistema Expo pero no es la única opción segura.
- **Dependencia del ecosistema Expo**: si el proyecto migra a bare React Native sin Expo modules, `expo-crypto` deja de funcionar y hay que reemplazarlo (por `react-native-quick-crypto` u otra solución).
- **No hay verificación del state PKCE en el mock**: el handler de MSW acepta cualquier `state` sin validarlo contra el verifier. En producción, el authorization server debe validar que el `state` del callback coincide con el enviado.
