# BankGo — Wireframes del Flujo Principal

> Wireframes ASCII del flujo completo de la aplicación.  
> Última actualización: 2026-04-30

---

## Mapa de navegación

```
                    ┌─────────────────┐
                    │   APP STARTUP   │
                    │  restoreSession │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │ session válida?             │
             NO                           SÍ
              │                             │
              ▼                             ▼
    ┌─────────────────┐         ┌─────────────────────┐
    │   LOGIN SCREEN  │         │  DASHBOARD SCREEN   │
    └────────┬────────┘         └──────────┬──────────┘
             │ [login exitoso]             │
             └─────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
         ┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────┐
         │  ACCOUNT SCREEN  │  │   TRANSFER SCREEN   │  │  CARDS SCREEN   │
         │  [tap cuenta]    │  │   [tap Transferir]  │  │  [tab Tarjetas] │
         │                  │  │                     │  │                 │
         │  Transacciones   │  │ Step 1: Form        │  │  Lista tarjetas │
         │  paginadas       │  │       ↓             │  │  Toggle freeze  │
         └──────────────────┘  │ Step 2: Review      │  └─────────────────┘
                               │       ↓             │
                               │ Step 3: Confirmed   │
                               └─────────────────────┘
```

---

## 1. Login Screen

```
┌─────────────────────────────────┐
│                                 │
│         ██████████████          │
│         ██  BankGo  ██          │
│         ██████████████          │
│                                 │
│      Banca personal segura      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Correo electrónico             │
│  ┌───────────────────────────┐  │
│  │ maria.garcia@example.com  │  │
│  └───────────────────────────┘  │
│                                 │
│  Contraseña                     │
│  ┌───────────────────────────┐  │
│  │ ••••••••••••              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │     Iniciar sesión    →   │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠ Error: Credenciales          │  ← visible solo si hay error
│    inválidas                    │
│                                 │
│  ┌─────────────────────────┐    │  ← visible mientras carga
│  │  ◌ Iniciando sesión...  │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘

Estados:
  · Idle     → campos habilitados, botón activo
  · Loading  → spinner en botón, campos deshabilitados
  · Error    → banner rojo bajo contraseña, campos re-habilitados
```

---

## 2. Dashboard Screen

```
┌─────────────────────────────────┐
│  BankGo            [👤 María G] │  ← header + avatar usuario
│─────────────────────────────────│
│                                 │
│  ┌───────────────────────────┐  │  ← OfflineBanner (solo offline)
│  │ ⚠ Sin conexión — datos    │  │
│  │   guardados localmente    │  │
│  └───────────────────────────┘  │
│                                 │
│  Mis cuentas                    │
│                                 │
│  ┌───────────────────────────┐  │  ← AccountCard × N
│  │ 💳 Cuenta Corriente       │  │
│  │ S/. 12,450.00             │  │
│  │ IBAN: ····3421            │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🏦 Cuenta Ahorros         │  │
│  │ S/. 38,200.75             │  │
│  │ IBAN: ····8802            │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📈 Inversiones            │  │
│  │ USD 5,000.00              │  │
│  │ IBAN: ····1190            │  │
│  └───────────────────────────┘  │
│                                 │
│  · · ·                          │  ← loading skeleton (mientras carga)
│                                 │
│─────────────────────────────────│
│  [🏠 Inicio] [↔ Transferir] [💳 Tarjetas]  │  ← Tab bar
└─────────────────────────────────┘

Acciones:
  · Tap AccountCard → Account/Transactions Screen
  · Tap tab Transferir → Transfer Screen
  · Tap tab Tarjetas → Cards Screen
```

---

## 3. Account / Transactions Screen

```
┌─────────────────────────────────┐
│  ← Volver          Corriente    │  ← header con tipo de cuenta
│─────────────────────────────────│
│                                 │
│  ┌───────────────────────────┐  │  ← resumen de cuenta
│  │  Cuenta Corriente         │  │
│  │  IBAN: ····3421           │  │
│  │                           │  │
│  │  Saldo disponible         │  │
│  │  S/. 12,450.00            │  │
│  └───────────────────────────┘  │
│                                 │
│  Movimientos recientes          │
│                                 │
│  ┌───────────────────────────┐  │  ← TransactionItem (crédito)
│  │ ↑ Depósito salario        │  │
│  │   Empleador S.A.          │  │
│  │   30 abr 2026    +S/5,000 │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │  ← TransactionItem (débito)
│  │ ↓ Supermercado            │  │
│  │   La Favorita             │  │
│  │   29 abr 2026    -S/. 245 │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ↓ Netflix                 │  │
│  │   Streaming               │  │
│  │   28 abr 2026    -USD 15  │  │
│  └───────────────────────────┘  │
│                                 │
│  · · ·                          │
│                                 │
│  ┌───────────────────────────┐  │  ← paginación
│  │    Cargar más (20/87)  ↓  │  │
│  └───────────────────────────┘  │
│                                 │
│  ─── Empty state ───            │  ← visible si no hay transacciones
│  ┌───────────────────────────┐  │
│  │     📋                    │  │
│  │  Sin movimientos          │  │
│  │  Esta cuenta aún no       │  │
│  │  tiene transacciones      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘

Paginación: page=1&limit=20 → "Cargar más" → page=2&limit=20
TransactionItem: ↑ crédito (verde) | ↓ débito (rojo)
```

---

## 4. Transfer Screen — Paso 1: Formulario

```
┌─────────────────────────────────┐
│  ← Volver       Transferir      │
│─────────────────────────────────│
│                                 │
│  ① Datos  ──  ② Revisar  ──  ③ Listo  │  ← stepper
│  ●─────────────○───────────○   │
│                                 │
│  Cuenta de origen               │
│  ┌───────────────────────────┐  │
│  │ ▾ Cuenta Corriente        │  │  ← picker de cuentas
│  │   S/. 12,450.00           │  │
│  └───────────────────────────┘  │
│                                 │
│  Beneficiario                   │
│  ┌───────────────────────────┐  │
│  │ ▾ Seleccionar...          │  │  ← picker de beneficiarios
│  └───────────────────────────┘  │
│                                 │
│  Monto                          │
│  ┌──────────┐  ┌─────────────┐  │
│  │ PEN ▾   │  │ 0.00        │  │  ← moneda + monto
│  └──────────┘  └─────────────┘  │
│                                 │
│  Descripción (opcional)         │
│  ┌───────────────────────────┐  │
│  │ Pago de alquiler          │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠ Saldo insuficiente.          │  ← error de validación (si aplica)
│    Disponible: S/. 12,450.00    │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Continuar →         │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘

Validaciones:
  · fromAccountId no null
  · beneficiaryId no null
  · amount > 0
  · amount ≤ balance de la cuenta origen
```

---

## 5. Transfer Screen — Paso 2: Revisión

```
┌─────────────────────────────────┐
│  ← Volver       Confirmar       │
│─────────────────────────────────│
│                                 │
│  ① Datos  ──  ② Revisar  ──  ③ Listo  │
│  ●────────────●───────────○    │
│                                 │
│  Revisá los detalles            │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Resumen de transferencia │  │
│  │  ─────────────────────── │  │
│  │  Desde                   │  │
│  │  Cuenta Corriente         │  │
│  │  ····3421                 │  │
│  │                           │  │
│  │  Hacia                    │  │
│  │  Carlos Ramírez           │  │
│  │  BCP · ····9901           │  │
│  │                           │  │
│  │  Monto                    │  │
│  │  S/. 1,500.00             │  │
│  │                           │  │
│  │  Descripción              │  │
│  │  Pago de alquiler         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ◌ Procesando...          │  │  ← visible mientras submitting
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    ✓ Confirmar y enviar   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Cancelar            │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘

Acción: POST /transfers → pendingTransfer
Luego: POST /transfers/:id/confirm
```

---

## 6. Transfer Screen — Paso 3: Confirmado

```
┌─────────────────────────────────┐
│                 ✓ Listo         │
│─────────────────────────────────│
│                                 │
│  ① Datos  ──  ② Revisar  ──  ③ Listo  │
│  ●────────────●────────────●   │
│                                 │
│                                 │
│            ✅                   │
│                                 │
│     ¡Transferencia exitosa!     │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ID: tr-0001              │  │
│  │  Monto: S/. 1,500.00      │  │
│  │  Para: Carlos Ramírez     │  │
│  │  Estado: confirmada       │  │
│  │  Fecha: 30/04/2026 14:32  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    Nueva transferencia    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Ir al inicio        │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘

In-app notification: "¡Transferencia realizada con éxito!" (toast)
"Nueva transferencia" → resetTransfer() → volver a Step 1
```

---

## 7. Cards Screen

```
┌─────────────────────────────────┐
│  BankGo               Tarjetas  │
│─────────────────────────────────│
│                                 │
│  Mis tarjetas                   │
│                                 │
│  ┌───────────────────────────┐  │  ← Card activa (VISA)
│  │                           │  │
│  │  ████████████████████     │  │
│  │  ████  VISA  ██████       │  │
│  │  ████████████████████     │  │
│  │                           │  │
│  │  **** **** **** 4821      │  │
│  │  María García             │  │
│  │  Vence: 12/28             │  │
│  │                           │  │
│  │  Estado: ✅ Activa         │  │
│  │  ┌─────────────────────┐  │  │
│  │  │   Congelar tarjeta  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │  ← Card congelada (Mastercard)
│  │                           │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░    │  │  ← visual atenuado (frozen)
│  │  ░░  MASTERCARD  ░░░░     │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░    │  │
│  │                           │  │
│  │  **** **** **** 9034      │  │
│  │  María García             │  │
│  │  Vence: 03/27             │  │
│  │                           │  │
│  │  Estado: 🔒 Congelada      │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  Descongelar tarjeta │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                 │
│─────────────────────────────────│
│  [🏠 Inicio] [↔ Transferir] [💳 Tarjetas]  │
└─────────────────────────────────┘

Toggle freeze:
  · Tap "Congelar" → optimistic update inmediato → PATCH /cards/:id
  · Si falla → revert al estado anterior
  · Si éxito → sincronizar con respuesta del servidor
```

---

## 8. Estados transversales

### Offline Banner

```
┌─────────────────────────────────┐
│ ⚠ Sin conexión — mostrando      │
│   datos guardados localmente    │  ← isOffline: true en store
└─────────────────────────────────┘
```

Aparece en Dashboard y Account cuando `isOffline: true` en `accountsStore` / `transactionsStore`. El banner desaparece automáticamente cuando se restaura la conexión y el store re-fetcha datos frescos.

---

### Error State

```
┌─────────────────────────────────┐
│                                 │
│             ⚠️                   │
│                                 │
│     No se pudieron cargar       │
│     las cuentas                 │
│                                 │
│  Error: Network request failed  │  ← mensaje técnico (solo en DEV)
│                                 │
│  ┌─────────────────────────┐    │
│  │      Reintentar ↺       │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

Aparece cuando hay error de red Y no hay cache disponible. El botón "Reintentar" llama a `fetchAccounts()` / `fetchTransactions()` nuevamente.

---

### Empty State

```
┌─────────────────────────────────┐
│                                 │
│             📋                  │
│                                 │
│       Sin transacciones         │
│                                 │
│  Esta cuenta aún no tiene       │
│  movimientos registrados        │
│                                 │
└─────────────────────────────────┘
```

Aparece cuando la cuenta existe pero el array `transactions` está vacío (primera vez del usuario, cuenta nueva).

---

### Loading Skeleton

```
┌─────────────────────────────────┐
│                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ← shimmer / placeholder
│                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                 │
└─────────────────────────────────┘
```

Aparece mientras `isLoading: true` en cualquier store. Reemplaza la lista de cuentas o transacciones durante el fetch inicial.

---

### In-App Notification (Toast)

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │  ← aparece desde arriba, 3s
│  │ ✓ ¡Transferencia        │    │
│  │   realizada con éxito!  │    │
│  └─────────────────────────┘    │
│                                 │
│  [contenido de la pantalla]     │
│                                 │
└─────────────────────────────────┘
```

Disparado por `notification: { message, type }` en `transferStore`. Auto-dismiss después de 3s o al tocar. Implementado en `InAppNotification.tsx`.
