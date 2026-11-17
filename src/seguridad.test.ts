// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(__dirname, "..");
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = path.join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}
const fuentes = archivos(path.join(raiz, "src")).filter(
  (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f),
);
const leer = (f: string) => readFileSync(f, "utf8");

describe("lista de seguridad (comprobaciones automáticas)", () => {
  it("el navegador no importa firebase/firestore (ni firebase-admin)", () => {
    for (const f of fuentes) {
      expect(leer(f), f).not.toMatch(/from ["']firebase\/firestore["']/);
      if (/^["']use client["']/.test(leer(f).trimStart())) {
        expect(leer(f), f).not.toMatch(/firebase-admin/);
      }
    }
  });

  it("solo la configuración web de Firebase usa NEXT_PUBLIC_*", () => {
    const permitidas = new Set([
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]);
    const usadas = [...fuentes, path.join(raiz, ".env.example")].flatMap(
      (f) => leer(f).match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? [],
    );
    for (const nombre of usadas) expect(permitidas.has(nombre), nombre).toBe(true);
  });

  it("no hay secretos escritos en el código ni en .env.example", () => {
    const sospechoso =
      /-----BEGIN [A-Z ]*PRIVATE KEY-----\s*[A-Za-z0-9+/]{20,}|AIza[0-9A-Za-z_-]{35}/;
    for (const f of [...fuentes, path.join(raiz, ".env.example"), path.join(raiz, "README.md")]) {
      expect(leer(f), f).not.toMatch(sospechoso);
    }
  });

  it("las reglas de Firestore niegan todo acceso directo", () => {
    const reglas = leer(path.join(raiz, "firestore.rules"));
    expect(reglas).toContain("allow read, write: if false;");
    expect(reglas).not.toMatch(/allow [^;]*if true/);
  });

  it("toda ruta POST/DELETE de la API verifica el Origin", () => {
    const rutas = fuentes.filter(
      (f) => f.includes(`${path.sep}api${path.sep}`) && f.endsWith("route.ts"),
    );
    expect(rutas.length).toBeGreaterThan(0);
    for (const f of rutas) {
      const codigo = leer(f);
      if (/export async function (POST|PUT|PATCH|DELETE)/.test(codigo)) {
        expect(codigo, f).toContain("verificarOrigen(req)");
      }
    }
  });

  it("toda ruta privada de la API verifica la sesión", () => {
    const rutas = fuentes.filter(
      (f) => f.includes(`${path.sep}api${path.sep}grupos`) && f.endsWith("route.ts"),
    );
    for (const f of rutas) expect(leer(f), f).toContain("uidActual()");
  });

  it("la cookie de sesión se crea HttpOnly, Secure y SameSite", () => {
    const codigo = leer(path.join(raiz, "src/app/api/sesion/route.ts"));
    expect(codigo).toContain("httpOnly: true");
    expect(codigo).toContain("secure:");
    expect(codigo).toContain('sameSite: "strict"');
  });
});
