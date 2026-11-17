// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const createSessionCookie = vi.fn();
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken, createSessionCookie }),
}));
vi.mock("@/lib/firebase-admin", () => ({
  hayFirebase: () => process.env.FIREBASE_PROJECT_ID === "p",
  appAdmin: () => ({}),
}));

import { DELETE, POST } from "./sesion/route";

const peticion = (cuerpo: unknown, origin: string | null = "http://localhost") =>
  new Request("http://localhost/api/sesion", {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(cuerpo),
  });
const TOKEN = "x".repeat(30);

beforeEach(() => {
  verifyIdToken.mockReset();
  createSessionCookie.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/sesion", () => {
  it("responde 501 si Firebase no está configurado", async () => {
    expect((await POST(peticion({ idToken: TOKEN }))).status).toBe(501);
  });

  describe("con Firebase", () => {
    beforeEach(() => vi.stubEnv("FIREBASE_PROJECT_ID", "p"));

    it("rechaza un Origin ajeno con 403 sin llamar a Firebase", async () => {
      const r = await POST(peticion({ idToken: TOKEN }, "https://malo.com"));
      expect(r.status).toBe(403);
      expect(verifyIdToken).not.toHaveBeenCalled();
    });

    it("valida el cuerpo con zod (422)", async () => {
      expect((await POST(peticion({ idToken: "corto" }))).status).toBe(422);
    });

    it("crea una cookie HttpOnly, SameSite=Strict y Secure en producción", async () => {
      vi.stubEnv("NODE_ENV", "production");
      verifyIdToken.mockResolvedValue({ uid: "u1", auth_time: Date.now() / 1000 });
      createSessionCookie.mockResolvedValue("COOKIE-DE-SESION");
      const r = await POST(peticion({ idToken: TOKEN }));
      expect(r.status).toBe(200);
      const c = (r.headers.get("set-cookie") ?? "").toLowerCase();
      expect(c).toContain("sesion=cookie-de-sesion");
      expect(c).toContain("httponly");
      expect(c).toContain("secure");
      expect(c).toContain("samesite=strict");
    });

    it("exige un inicio de sesión reciente (401)", async () => {
      verifyIdToken.mockResolvedValue({ uid: "u1", auth_time: Date.now() / 1000 - 3600 });
      expect((await POST(peticion({ idToken: TOKEN }))).status).toBe(401);
      expect(createSessionCookie).not.toHaveBeenCalled();
    });

    it("responde 401 si el token es inválido", async () => {
      verifyIdToken.mockRejectedValue(new Error("token inválido"));
      expect((await POST(peticion({ idToken: TOKEN }))).status).toBe(401);
    });
  });
});

describe("DELETE /api/sesion", () => {
  it("borra la cookie de sesión", async () => {
    const r = await DELETE(
      new Request("http://localhost/api/sesion", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
    );
    expect(r.status).toBe(200);
    expect((r.headers.get("set-cookie") ?? "").toLowerCase()).toContain("max-age=0");
  });
  it("rechaza un Origin ajeno", async () => {
    const r = await DELETE(
      new Request("http://localhost/api/sesion", {
        method: "DELETE",
        headers: { origin: "https://malo.com" },
      }),
    );
    expect(r.status).toBe(403);
  });
});
