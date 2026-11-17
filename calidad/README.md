# Evidencias de calidad (sección 14)

Todo se puede reproducir; los informes y capturas se guardan aquí.

| Evidencia                     | Cómo reproducirla                                                                                             | Carpeta     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| Lighthouse (móvil/escritorio) | `npm run build && bash calidad/lighthouse.sh` (necesita Chrome) o DevTools → Lighthouse                       | `informes/` |
| LCP, INP, CLS antes/después   | Medir, anotar en `CALIDAD.md`, aplicar la mejora, volver a medir (INP: DevTools → Performance, interacciones) | `informes/` |
| Capturas 360, 768 y 1024      | DevTools → modo dispositivo, ancho 360 / 768 / 1024 en `/`, `/grupos/ejemplo`, `/grupos/[id]`                 | `capturas/` |
| axe (accesibilidad)           | Automática: `npx vitest run src/components/accesibilidad.test.tsx`; en navegador: extensión axe DevTools      | `informes/` |
| Validador HTML                | `npx html-validate -c calidad/htmlvalidate.json <archivos.html>` sobre las páginas de `next start`            | `informes/` |
| Contraste                     | Tabla de `CALIDAD.md` (calculada) + Lighthouse                                                                | —           |
