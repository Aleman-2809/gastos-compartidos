# 36 · Gastos compartidos entre amigos

Aplicación web (Next.js) para registrar los gastos de un grupo de amigos y saber quién le debe a
quién, con la lista **mínima** de pagos para saldar.

## Estado por hitos

| Hito | Contenido                                                                                    | Estado                                                                              |
| ---- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1    | Reparto, balances y pagos sugeridos con datos de ejemplo (`/grupos/ejemplo`)                 | Hecho                                                                               |
| 2    | Grupos, código de invitación, gastos (partes iguales o porcentajes), pagos, exportar a CSV   | Hecho                                                                               |
| 3    | API REST por capas con Zod, Firestore, variables de entorno, `openapi.yaml`, Bruno, pruebas  | Hecho en código; **Firestore sin probar contra un proyecto real**                   |
| 4    | Firebase Auth (cookie de sesión), roles, seguridad, calidad, despliegue, configuración de IA | Código y pruebas hechos; **falta** medir Lighthouse, capturas y desplegar en Vercel |

Qué está verificado y qué no está en `CALIDAD.md`.

## Ejecutar

```bash
npm install
cp .env.example .env.local   # opcional: sin credenciales de Firebase se usa memoria + identidad anónima
npm run dev                  # http://localhost:3000
npm run check                # lint + tipos + formato + pruebas con cobertura mínima
npm run build                # compilación de producción
npm run ia:probar            # pruebas de la configuración de IA (sección 15)
npm run audit                # npm audit (nivel alto)
```

## Rutas

- Páginas: `/`, `/entrar`, `/grupos`, `/grupos/nuevo`, `/unirse`, `/grupos/[id]`, `/grupos/[id]/gastos/nuevo`, `/grupos/ejemplo`.
- API (`openapi.yaml`; colección de Bruno en `bruno/`): `POST|DELETE /api/sesion`, `GET|POST /api/grupos`,
  `POST /api/grupos/unirse`, `POST /api/grupos/[id]/gastos`, `POST /api/grupos/[id]/pagos`,
  `GET /api/grupos/[id]/exportar`.
- Un usuario que no es miembro de un grupo recibe **404** (página y API); un código inexistente también devuelve 404.

## Seguridad

- **Sesión:** con Firebase Auth, el navegador obtiene un `idToken`, el servidor lo cambia por una cookie de
  sesión `HttpOnly`, `Secure` (en producción) y `SameSite=Strict`, y la verifica (revocable) en cada petición.
- **Origin:** toda petición que modifica datos exige un `Origin` del mismo sitio (403 si falta o es ajeno).
- **Autorización por objeto:** cada ruta comprueba la pertenencia al grupo; `proxy.ts` es solo una primera barrera.
  Los **roles** son por grupo: quien lo crea es `admin`; un pago solo lo registra quien paga, quien recibe o un `admin`.
- **Zod** valida toda entrada; el CSV neutraliza fórmulas (`=`, `+`, `-`, `@`); React escapa el contenido.
- **Firestore:** `firestore.rules` niega todo acceso directo (`allow read, write: if false`); el navegador no importa
  `firebase/firestore` (lo comprueba `src/seguridad.test.ts`). Los datos solo pasan por la API.
- **Secretos:** nada en Git; el único `NEXT_PUBLIC_*` permitido es la configuración web de Firebase (pública).

## Configurar Firebase y desplegar (pasos que hace una persona con acceso a las cuentas)

1. Crear un proyecto en Firebase → activar **Authentication** (correo/contraseña) y **Firestore**.
2. Publicar las reglas: `npx firebase deploy --only firestore:rules` (usa `firestore.rules`).
3. Crear una **cuenta de servicio** y copiar `project_id`, `client_email` y `private_key` a `.env.local`
   (`FIREBASE_*`), y la configuración web a `NEXT_PUBLIC_FIREBASE_*`.
4. Firestore pide un índice para `grupos` por `miembrosUids` (array-contains); el error de la consola trae el enlace para crearlo.
5. En **Vercel**: importar el repositorio, cargar las mismas variables de entorno y desplegar. En Firebase → Authentication → Settings,
   añadir el dominio de Vercel a los dominios autorizados.
6. Probar el flujo completo con la URL desplegada y anotar la URL aquí.

## Estructura

- `src/services/gastos.ts`: lógica pura (reparto en centavos, porcentajes, balances y pagos mínimos exactos).
- `src/lib/`: validación con Zod, repositorio (memoria y Firestore), sesión, Firebase, exportación CSV.
- `src/app/api/`: rutas de la API. `src/app/`: páginas. `src/components/`: formularios y diálogo.
- `ia/`: configuración de IA (`guardia.mjs`, pruebas, bitácora, `README.md`). `CALIDAD.md` y `calidad/`: evidencias de calidad.

## Variables de entorno

Ver `.env.example`. Con `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` la aplicación
usa Firestore y Firebase Auth; sin ellas usa memoria (los datos se pierden al reiniciar) y una identidad anónima.

## Historial de Git

El primer commit debe contener **solo** la configuración de IA (sección 15): `AGENTS.md`, `CLAUDE.md`,
`.claude/settings.json`, `ia/`, `.gitignore`, `.env.example`. Después, commits pequeños por funcionalidad.
