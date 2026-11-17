# Bitácora de uso de IA

Registro de lo que se le pidió a la IA, qué se aceptó y qué se verificó o corrigió.

## 2026-11-16 · Corrección tras la revisión del repositorio

- **Pedido:** corregir el proyecto según la lista de faltantes de la revisión (páginas, requisitos RF-01 a RF-06,
  back-end, pruebas, algoritmo de pagos, calidad, configuración de IA y Git).
- **Aceptado:** rutas y páginas nuevas, API con zod, repositorio en memoria y Firestore, reparto por
  porcentajes, algoritmo exacto de pagos mínimos, pruebas de lógica, componentes, API e integración,
  `AGENTS.md`/`CLAUDE.md`, scripts `check`, Prettier, Husky y CI.
- **Verificado:** `npm run check` y `npm run build` pasan; se probó el flujo completo con el servidor en
  producción local (crear grupo, gasto, exportar, 404 para ajenos).
- **Pendiente de hacer a mano:** probar Firestore con un proyecto real, Firebase Auth, despliegue en Vercel,
  Lighthouse y capturas, y ajustar el caso de la prueba de reparto al de la especificación.

## 2026-11-16 · Configuración de IA, autenticación, seguridad y calidad (segunda ronda)

- **Propósito:** cerrar lo que faltaba tras la revisión: evidencias de la sección 15, Firebase Auth con
  cookie de sesión, comprobación de `Origin`, roles, reglas de Firestore, pruebas de componentes/API/seguridad,
  accesibilidad automática y reglas de calidad.
- **Evidencia:** `ia/guardia.mjs` y `ia/guardia.test.ts` (bloqueo de `.env`, claves y rutas externas; permiso
  para acciones externas); `src/seguridad.test.ts`; `src/app/api/sesion.test.ts`; `src/proxy.test.ts`;
  `src/components/accesibilidad.test.tsx` (axe-core); `npm run check` con 135 pruebas y cobertura ≥ 90 % de líneas.
- **Validación:** `npm run check`, `npm run build` y `npm audit` sin vulnerabilidades; prueba manual con
  `next start` (404 real para grupo ajeno e inexistente, 403 sin `Origin`, 404 con código inexistente);
  validador HTML sobre las páginas generadas.
- **Decisión / correcciones encontradas al probar:**
  - La página de un grupo ajeno respondía **200** con el aviso «no encontrado» (streaming de `loading.tsx` +
    `cacheComponents`). Se quitaron `cacheComponents`/PPR y se movió la comprobación a `grupos/[id]/layout.tsx`
    → ahora responde **404** real.
  - `PagosSugeridos` fallaba donde `dialog.close()` no existe; se añadió respaldo.
  - `.gitignore` ignoraba `.env.example`; se añadió `!.env.example`.
  - `npm audit` marcaba 4 vulnerabilidades altas (`@grpc/grpc-js` dentro de `firebase`); se resolvió con `overrides`.
  - Cinco `<input>` sin `type` (validador HTML); corregidos.
- **Pendiente a mano (no se pudo hacer sin tus cuentas):** probar Firestore y Firebase Auth con un proyecto
  real, medir Lighthouse y tomar capturas, desplegar en Vercel, confirmar el caso exacto del reparto con la
  especificación y construir el historial de Git (ver `README.md`).
