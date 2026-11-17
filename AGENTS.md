<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reglas del proyecto

- Idioma: la interfaz y los commits van en español. El código no lleva comentarios salvo directivas (`@vitest-environment`, `eslint-disable`) y razones no obvias.
- Dinero siempre en **centavos enteros** (`montoCentavos`); nunca `float`. Solo se convierte a pesos al mostrar.
- La lógica de negocio vive en `src/services/gastos.ts` como funciones puras con pruebas. Cualquier cambio ahí exige una prueba nueva.
- Toda entrada de la API se valida con zod (`src/lib/schemas.ts`) antes de usarse.
- Un usuario que no es miembro de un grupo recibe **404**, no 403 (no revelar que el grupo existe).
- HTML semántico, enlace «Saltar al contenido», controles de al menos 44 px y contraste AA.
- Antes de dar algo por terminado: `npm run check` y `npm run build` deben pasar.
- Commits pequeños y frecuentes, con mensaje descriptivo. No subir `node_modules`, `.next`, `coverage` ni `.env*` (salvo `.env.example`).
- No inventar resultados: si algo no se pudo medir o probar (Lighthouse, Firestore real), decirlo en `CALIDAD.md` o en el README.

## Seguridad (obligatorio para la IA)

- **Nunca leer ni mostrar** `.env*` (salvo `.env.example`), claves, `*.pem` ni credenciales. No pegarlas en código, commits, logs ni la bitácora.
- **No salir de la carpeta del proyecto** (nada de `../`, `~`, `/etc`). Las reglas están en `.claude/settings.json` y las refuerza `ia/guardia.mjs`; se prueban con `npm run ia:probar`.
- Acciones con efecto fuera de la máquina (`git push`, `curl`, despliegues, `npm publish`) **piden permiso**: nunca ejecutarlas por cuenta propia.
- Toda ruta de `src/app/api/` que modifique datos llama primero a `verificarOrigen(req)`, y toda ruta privada comprueba la sesión con `uidActual()` y la pertenencia al grupo (404 si no es miembro).
- Los datos pasan siempre por la API: **el navegador no importa `firebase/firestore`**. Solo `firebase/auth` y solo variables `NEXT_PUBLIC_FIREBASE_*`.
- No debilitar `eslint.config.mjs`, los umbrales de cobertura ni los hooks de Husky para que algo «pase».
