# Uso de Inteligencia Artificial — BankGo
## Reporte honesto del proceso de desarrollo con IA

> Este documento responde directamente a los puntos 5 y 6 del caso técnico.  
> Fue redactado por el arquitecto (GentleIA) y no por un sub-agente — porque requiere reflexión real sobre las decisiones tomadas durante el proceso.

---

## Herramientas de IA utilizadas

### OpenCode
**Rol**: Motor de orquestación de agentes especializados. Gestiona el ciclo de vida completo del SDLC mediante sub-agentes que ejecutan fases acotadas (exploración, especificación, diseño, implementación, verificación).

**Cómo se usó**: No como autocompletado de IDE — como un sistema de agentes que recibe instrucciones precisas del arquitecto, ejecuta una fase, y devuelve resultados verificables. Cada sub-agente tiene contexto inyectado, restricciones explícitas, y su output se valida antes de pasar a la siguiente fase.

### GentleIA (Claude — anthropic/claude-sonnet-4-6)
**Rol**: Arquitecto senior y orquestador. Tomó todas las decisiones de diseño, redactó las instrucciones para cada sub-agente, validó cada output, y rechazó o corrigió lo que no cumplía los estándares.

**Modelo base**: `anthropic/claude-sonnet-4-6` — usado tanto en el orquestador como en todos los sub-agentes de esta solución.

---

## Fases del SDLC y uso de IA por fase

| Fase | Tarea | Sub-agente usado | Validación humana |
|------|-------|-----------------|-------------------|
| 0 — Setup | Estructura de carpetas, configuración | Orquestador (inline) | Setup verificado manualmente |
| 1 — Mock API | Tipos TypeScript, handlers MSW, seed data | `sdd-apply` | Revisión de tipos, datos ficticios |
| 2 — Auth PKCE | Generador PKCE, AuthService, login screen | `sdd-apply` | **Auditoría manual contra RFC 7636** |
| 3 — Dashboard | Stores Zustand, cache, componentes UI | `sdd-apply` | Revisión de lógica offline, estados UX |
| 4 — Transfer/Cards | Flujo de transferencia, toggle tarjetas | `sdd-apply` | Revisión de validaciones, optimistic update |
| 5 — Tests | 25 tests en 5 suites | `sdd-apply` | **Ejecución real + revisión de assertions** |
| 6 — CI/CD | GitHub Actions workflow | Orquestador (inline) | Revisión del YAML |
| 7 — Documentación | README, architecture, ADRs, wireframes | `sdd-apply` | Revisión de exactitud técnica |
| 7 — ai-usage.md | **Este documento** | **Ninguno — redactado por el arquitecto** | — |

---

## Tareas específicas donde la IA agregó valor concreto

### 1. Generación del boilerplate tipado

**Tarea**: Crear los 15+ tipos TypeScript del dominio (Account, Transaction, Card, Transfer, etc.) y los handlers MSW v2 para 9 endpoints.

**Valor generado**: Lo que hubiera tomado 2-3 horas de escritura manual se generó en minutos con consistencia entre tipos y handlers. La IA mantuvo la coherencia entre `Transaction.accountId` en los tipos y la lógica de filtrado en los handlers.

**Lo que se validó**: Que los nombres de campos coincidieran entre tipos, seed data y handlers. Un error aquí hubiera roto el runtime silenciosamente en TypeScript con `any`.

### 2. Implementación del flujo PKCE

**Tarea**: Implementar `generateCodeVerifier()`, `generateCodeChallenge()` y `generateState()` usando `expo-crypto`.

**Valor generado**: La IA conocía el RFC 7636 y generó la implementación correcta de base64url (sin padding `=`, con `-` en lugar de `+` y `_` en lugar de `/`). El detalle del encoding es un bug clásico que rompe el flujo de auth silenciosamente.

**Lo que se validó manualmente**: El test de PKCE (`__tests__/services/pkce.test.ts`) calcula el SHA-256 esperado usando Node.js crypto y lo compara contra el output de la implementación. Esto es una verificación contra la fuente (RFC), no solo "que el test pase".

### 3. Logger con sanitización de PII

**Tarea**: Implementar un logger que redacte tokens, passwords y cualquier dato sensible antes de imprimir a consola.

**Valor generado**: La IA propuso los 4 patrones regex necesarios para cubrir los casos más comunes de leak de tokens.

**Lo que se validó manualmente**: El test del logger (`__tests__/services/logger.test.ts`) verifica que ningún patrón sensible pasa al output. Se revisó que los regex no sean demasiado agresivos (falsos positivos) ni demasiado permisivos (falsos negativos).

### 4. Arquitectura de offline-first

**Tarea**: Implementar el patrón: intentar fetch → si falla → leer cache → mostrar banner offline.

**Valor generado**: La IA implementó el flujo de try/catch con fallback a AsyncStorage y el estado `isOffline` propagado a la UI. El optimistic update en `toggleCardFreeze` (revertir si falla) también fue generado correctamente.

**Lo que se validó**: El test de `accountsStore` (`__tests__/stores/accountsStore.test.ts`) verifica los 3 escenarios: fetch ok, fetch falla con cache, fetch falla sin cache.

### 5. Tests unitarios no triviales

**Tarea**: Generar 25 tests significativos en 5 suites.

**Valor generado**: La IA propuso casos edge que son fáciles de olvidar manualmente: monto cero en transferencia, TTL expirado en cache, aleatoriedad del code verifier (que dos llamadas producen valores distintos).

**Lo que se validó**: Se ejecutaron todos los tests (`npx jest --coverage`). Se revisó que cada `expect()` tenga una assertion con semántica real — no `expect(true).toBe(true)`.

---

## Tareas que se decidió NO delegar a IA

### 1. La lógica PKCE no se delegó sin auditoría

El flujo PKCE tiene un contrato criptográfico preciso (RFC 7636). La IA puede generarlo correctamente, pero una implementación incorrecta de base64url pasa el type-checker y falla en runtime. **Decisión**: el código generado se auditó contra el RFC y se verificó con un test que recalcula el hash esperado de forma independiente.

### 2. El `ai-usage.md` no se delegó

Este documento requiere reflexión honesta sobre el proceso. Si lo genera un sub-agente, produce texto que suena correcto pero no refleja lo que realmente ocurrió. **Decisión**: lo redacté yo (el arquitecto) con evidencia concreta de cada decisión.

### 3. Las decisiones de arquitectura de capas no se delegaron

La estructura de capas (Presentation → Domain → Infrastructure) y la separación entre AsyncStorage y SecureStore son decisiones de diseño que requieren juicio sobre mantenibilidad, seguridad y escalabilidad. La IA las ejecutó, pero el diseño lo tomé yo.

### 4. La validación de que los tests son significativos

Un sub-agente puede generar tests que siempre pasan (`expect(component).toBeDefined()`). **Decisión**: cada suite de tests fue revisada para confirmar que los assertions fallarían si hubiera un bug real en el código que están probando.

---

## Cómo se validó el output generado por IA

### Protocolo de validación

```
Sub-agente produce output
         ↓
TypeScript type-check (npx tsc --noEmit)
         ↓
¿Errores de tipos? → Enviar de vuelta con correcciones
         ↓
Ejecución de tests (npx jest)
         ↓
¿Tests fallan? → Revisar + corregir
         ↓
Code review manual de la lógica de seguridad
         ↓
Aprobado → siguiente fase
```

### Evidencia de validación

- `npx tsc --noEmit` → **0 errores** en todos los archivos del proyecto
- `npx jest --coverage` → **25/25 tests passing**
- Auditoría manual de `pkce.ts`, `logger.ts` y `authService.ts` contra sus respectivas fuentes (RFC 7636, OWASP)

---

## Seguridad en el uso de herramientas de IA (Punto 6 del caso)

### Protección de información sensible

- **Ningún secreto real pasó por los prompts de IA**: el proyecto usa un backend mock. No hay credenciales reales, API keys, ni PII de clientes en ningún prompt enviado a la IA.
- **Datos seed ficticios**: los nombres, IBANs y correos en `seed.ts` son completamente inventados (María García, example.com).
- **Tokens simulados**: los tokens son strings opacos (`'mock-access-token-abc123'`), no JWTs con payload real.

### Control de logs generados automáticamente

- El `logger.ts` sanitiza cualquier string antes de imprimir a consola.
- En producción (`__DEV__ === false`), solo los errores se imprimen.
- Los tokens nunca aparecen en logs — ni siquiera en desarrollo.

### Cumplimiento de buenas prácticas OWASP Mobile

| Riesgo OWASP | Mitigación implementada |
|---|---|
| M1: Improper Credential Usage | Tokens en SecureStore, nunca en AsyncStorage |
| M2: Inadequate Supply Chain Security | `npm audit` antes de cada fase |
| M4: Insufficient Input/Output Validation | Validación de formularios antes de POST, sanitización de logs |
| M8: Security Misconfiguration | No PII en logs, .env.example sin valores reales, .gitignore para .env.local |
| M9: Insecure Data Storage | SecureStore para tokens, AsyncStorage solo para datos no sensibles |

### Lineamientos para uso de IA en equipos de desarrollo

1. **La IA propone, el humano decide.** Ningún output de IA va directo a producción sin revisión. Tratar el código generado por IA como un PR de un desarrollador junior competente pero sin contexto del negocio.

2. **Nunca pasar información sensible al prompt.** Credenciales, PII, código propietario sensible → siempre usar placeholders o versiones sanitizadas en los prompts.

3. **Los tests generados por IA se ejecutan, no se asumen.** Un test que "compila" no es un test que pasa. Un test que "pasa" no es necesariamente un test significativo. Revisar que cada `expect()` fallaría si el código tuviera un bug.

4. **Seguridad = auditoría humana obligatoria.** Lógica de auth, criptografía, validación de permisos, sanitización de inputs — siempre se audita contra la fuente primaria (RFC, OWASP, docs oficiales). La IA puede tener contexto desactualizado o simplificar incorrectamente.

5. **Ramas antes de aplicar sugerencias de IA.** Nunca aplicar cambios sugeridos por IA directamente en `main`. Siempre en una rama con nombre descriptivo.

6. **Documentar el uso de IA en el proyecto.** Este documento es el ejemplo. El equipo necesita saber qué fue generado con IA para poder auditarlo y mantenerlo responsablemente.

7. **Control de historial de prompts.** En IDEs con integración de IA, el historial de conversaciones puede contener fragmentos de código o respuestas que incluyan datos sensibles inadvertidamente. Revisar periódicamente y limpiar historial si es necesario.

---

## Ejemplos concretos de valor generado (con evidencia)

| Evidencia | Descripción | Archivo |
|---|---|---|
| 9 endpoints MSW en <5 min | Handlers tipados con auth guard, latencias, mutación en memoria | `src/services/api/handlers.ts` |
| PKCE correcto al primer intento | `generateCodeChallenge()` pasa el test de SHA-256 contra Node.js crypto | `src/services/auth/pkce.ts` |
| 25 tests pasando | Incluyendo casos edge (TTL expirado, monto cero, offline sin cache) | `__tests__/` |
| 5 ADRs documentados | Con trade-offs reales, no solo ventajas | `docs/technical-decisions.md` |
| Optimistic update correcto | Toggle de tarjeta revierte si el PATCH falla | `src/stores/cardsStore.ts` |

---

*Redactado por GentleIA (arquitecto) — `anthropic/claude-sonnet-4-6`*  
*Fecha: 2026-04-30*  
*Proyecto: BankGo — Caso técnico Inteligo Group*
