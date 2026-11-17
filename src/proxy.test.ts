// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { esRutaPrivada, proxy } from "./proxy";

const pedir = (ruta: string, cookie?: string) =>
  new NextRequest(`http://localhost${ruta}`, { headers: cookie ? { cookie } : {} });

afterEach(() => vi.unstubAllEnvs());

describe("esRutaPrivada", () => {
  it.each(["/grupos", "/grupos/nuevo", "/grupos/abc", "/grupos/abc/gastos/nuevo", "/unirse"])(
    "%s es privada",
    (r) => expect(esRutaPrivada(r)).toBe(true),
  );
  it.each(["/", "/entrar", "/grupos/ejemplo", "/api/grupos"])("%s es pública", (r) =>
    expect(esRutaPrivada(r)).toBe(false),
  );
});

describe("proxy sin Firebase (modo demostración)", () => {
  it("asigna una cookie uid HttpOnly a quien no la tiene", () => {
    const r = proxy(pedir("/grupos"));
    const cookie = r.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("uid=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });
  it("no reasigna la cookie si ya existe", () => {
    expect(proxy(pedir("/grupos", "uid=abc")).headers.get("set-cookie")).toBeNull();
  });
});

describe("proxy con Firebase", () => {
  const activar = () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "p");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "e@p.iam");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "k");
  };
  it("redirige a /entrar si falta la cookie de sesión en una ruta privada", () => {
    activar();
    const r = proxy(pedir("/grupos/abc"));
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toBe("http://localhost/entrar");
  });
  it("deja pasar las rutas públicas y las privadas con sesión", () => {
    activar();
    expect(proxy(pedir("/grupos/ejemplo")).status).toBe(200);
    expect(proxy(pedir("/grupos", "sesion=x")).status).toBe(200);
  });
  it("no crea la cookie anónima uid", () => {
    activar();
    expect(proxy(pedir("/")).headers.get("set-cookie")).toBeNull();
  });
});
