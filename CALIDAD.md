# Calidad

Lo medido está marcado con la fecha y la herramienta. Lo que **no** se ha medido aparece como «pendiente»; no se estima.

## Verificado automáticamente (2026-11-16, `npm run check`)

| Comprobación                     | Resultado                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (`--max-warnings=0`)      | 0 errores, 0 avisos (sin `any`, sin `console`, complejidad ≤ 15)                                                                                                                              |
| TypeScript                       | sin errores                                                                                                                                                                                   |
| Prettier                         | todo formateado                                                                                                                                                                               |
| Pruebas (Vitest)                 | 135 pasan: lógica, componentes, API, integración, seguridad, proxy, sesión, IA, OpenAPI                                                                                                       |
| Cobertura (v8)                   | sentencias 92,9 % · ramas 83,3 % · funciones 95,9 % · líneas 97,2 % (mínimos 90/80/90/90)                                                                                                     |
| `npm audit`                      | 0 vulnerabilidades (se fijó `@grpc/grpc-js` con `overrides`)                                                                                                                                  |
| axe-core sobre los componentes   | 0 violaciones en 6 vistas (sin contraste: jsdom no calcula estilos)                                                                                                                           |
| Validador HTML (`html-validate`) | sin errores reales en 7 páginas renderizadas; se corrigieron 5 `<input>` sin `type`. Se desactivaron reglas de mayúsculas/estilo que React genera y HTML acepta (`calidad/htmlvalidate.json`) |
| Prueba manual con `next start`   | 404 real para grupo ajeno e inexistente (página y API), 403 sin `Origin`, 404 con código inexistente, exportación CSV correcta                                                                |

## Contraste (calculado, WCAG 2.x)

| Par de colores                   | Tema claro | Tema oscuro | Mínimo AA       |
| -------------------------------- | ---------- | ----------- | --------------- |
| Texto / fondo                    | 17,4       | 16,7        | 4,5             |
| Enlaces (acento) / fondo         | 6,4        | 8,9         | 4,5             |
| Texto de botón / fondo del botón | 6,4        | 8,9         | 4,5             |
| Saldo positivo / fondo           | 6,7        | 10,3        | 4,5             |
| Saldo negativo y errores / fondo | 7,5        | 8,3         | 4,5             |
| Borde de campos / fondo          | 4,8        | 7,4         | 3 (componentes) |

## Accesibilidad y responsive (por código y axe; sin medir en navegador real)

- Enlace «Saltar al contenido», HTML semántico, tablas con `caption` y `scope`, `lang="es"`.
- Controles de al menos 44 px, foco visible, errores con `role="alert"`, diálogo con `<dialog>`.
- Tablas con desplazamiento horizontal en pantallas estrechas.

## Pendiente de medir (requiere Chrome y la URL desplegada)

Ejecutar `bash calidad/lighthouse.sh` y completar esta tabla con los valores reales. Mientras tanto, queda en blanco:

| Página            | Dispositivo | Rendimiento | Accesib. | Buenas prác. | SEO | LCP | INP | CLS |
| ----------------- | ----------- | ----------- | -------- | ------------ | --- | --- | --- | --- |
| `/`               | móvil       |             |          |              |     |     |     |     |
| `/grupos/ejemplo` | móvil       |             |          |              |     |     |     |     |
| `/grupos/[id]`    | móvil       |             |          |              |     |     |     |     |

**Antes y después:** anotar qué se cambió para mejorar LCP, INP y CLS y volver a medir.

- [ ] Informes de Lighthouse en `calidad/informes/`
- [ ] Capturas en 360, 768 y 1024 px en `calidad/capturas/`
- [ ] Retos elegidos, cada uno con su evidencia y cómo reproducirla
- [ ] Firestore y Firebase Auth probados con un proyecto real (hoy cubiertos solo con mocks)
- [ ] Despliegue en Vercel (URL en el README)
