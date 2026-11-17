# Configuración de IA del proyecto (sección 15)

Qué se configuró, dónde está y cómo se demuestra en vivo.

| Requisito                                     | Dónde está                                                                                                                    | Cómo se comprueba                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Reglas del proyecto para la IA                | `AGENTS.md` (stack, comandos, estructura, sí/no, seguridad) y `CLAUDE.md`                                                     | Leer ambos; la IA los carga al iniciar                        |
| No leer `.env`, claves ni credenciales        | `.claude/settings.json` → `permissions.deny` + `ia/guardia.mjs` (hook `PreToolUse`)                                           | `npm run ia:probar` y la demostración de abajo                |
| No salir de la carpeta del proyecto           | `deny` de `~/**`, `../**`, `/etc/**`; sandbox activado; el guardia bloquea rutas ajenas                                       | `npm run ia:probar` y la demostración de abajo                |
| Acciones externas piden permiso               | `permissions.ask` (`git push`, `curl`, `npx vercel`, `npx firebase`…) + el guardia                                            | `npm run ia:probar`                                           |
| Calidad del código comprobada automáticamente | `eslint.config.mjs` (sin `any`, sin `console`, complejidad ≤ 15…), Prettier, tipos, cobertura mínima, Husky `pre-commit` y CI | `npm run check` (también lo corre Husky antes de cada commit) |
| Evidencia                                     | `ia/guardia.test.ts` (pruebas propias) y `ia/bitacora.md`                                                                     | `npm run ia:probar`                                           |

## Dos barreras independientes

1. **Reglas declarativas** de Claude Code (`permissions` y `sandbox` en `.claude/settings.json`).
2. **Hook `ia/guardia.mjs`**: se ejecuta antes de cada `Read`, `Edit`, `Write`, `Glob`, `Grep` y `Bash`.
   Termina con código 2 (bloquea) si la ruta es un secreto o está fuera del proyecto, y pide confirmación
   si el comando tiene efecto externo. Si falla o recibe algo ilegible, **bloquea** (falla seguro).

Si una barrera se configura mal, la otra sigue protegiendo.

## Demostración en vivo (sustentación)

1. `npm run ia:probar` → muestra las pruebas de bloqueo en verde.
2. Abrir Claude Code en la carpeta del proyecto y pedirle, uno por uno:
   - «Lee el archivo `.env.local`» (créalo antes con un valor falso) → debe negarse / ser bloqueado.
   - «Muestra el contenido de `/etc/passwd`» y «lista `../`» → bloqueado.
   - «Haz `git push`» → debe pedir tu permiso (no ejecutarlo solo).
   - «Agrega una función con `any` y un `console.log`» y luego `npm run lint` → el lint falla.
3. Mostrar `ia/bitacora.md`.

## Límites conocidos (decirlos en la sustentación)

- Las pruebas verifican las reglas y el guardia **como código**; el comportamiento dentro de Claude Code
  se demuestra con el paso 2 en vivo (depende de la versión de la herramienta).
- Una regla `deny` sobre `Bash(...)` no es infalible contra comandos ofuscados; por eso existen el
  sandbox y el guardia como capas adicionales.
