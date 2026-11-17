// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

let galletas: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n in galletas ? { value: galletas[n] } : undefined),
  }),
}));
const verifySessionCookie = vi.fn();
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifySessionCookie }) }));
vi.mock("./firebase-admin", () => ({
  hayFirebase: () => process.env.FIREBASE_PROJECT_ID === "p",
  appAdmin: () => ({}),
}));

import { uidActual } from "./sesion";

afterEach(() => {
  galletas = {};
  verifySessionCookie.mockReset();
  vi.unstubAllEnvs();
});

describe("uidActual", () => {
  it("sin Firebase usa la cookie anónima uid", async () => {
    galletas = { uid: "anon-1" };
    expect(await uidActual()).toBe("anon-1");
  });

  describe("con Firebase", () => {
    const activar = () => vi.stubEnv("FIREBASE_PROJECT_ID", "p");

    it("ignora la cookie uid (no se puede suplantar a otro usuario)", async () => {
      activar();
      galletas = { uid: "yo-soy-ana" };
      expect(await uidActual()).toBeNull();
    });
    it("devuelve el uid de una cookie de sesión válida y la verifica como revocable", async () => {
      activar();
      galletas = { sesion: "abc" };
      verifySessionCookie.mockResolvedValue({ uid: "u1" });
      expect(await uidActual()).toBe("u1");
      expect(verifySessionCookie).toHaveBeenCalledWith("abc", true);
    });
    it("devuelve null si la cookie es inválida o expiró", async () => {
      activar();
      galletas = { sesion: "mala" };
      verifySessionCookie.mockRejectedValue(new Error("expirada"));
      expect(await uidActual()).toBeNull();
    });
  });
});
