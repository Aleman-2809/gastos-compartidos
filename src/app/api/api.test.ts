// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

let uidSimulado: string | null = "ana";
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n === "uid" && uidSimulado ? { value: uidSimulado } : undefined),
  }),
}));

import { reiniciarMemoria } from "@/lib/repositorio";
import { GET as listar, POST as crear } from "./grupos/route";
import { POST as unirse } from "./grupos/unirse/route";
import { POST as gasto } from "./grupos/[id]/gastos/route";
import { POST as pago } from "./grupos/[id]/pagos/route";
import { GET as exportar } from "./grupos/[id]/exportar/route";

const json = (cuerpo: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(cuerpo),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function grupoCreado() {
  const r = await crear(json({ nombre: "Paseo", tuNombre: "Ana" }));
  return (await r.json()) as { id: string; codigo: string };
}

beforeEach(() => {
  reiniciarMemoria();
  uidSimulado = "ana";
});

describe("API de grupos", () => {
  it("sin sesión responde 401", async () => {
    uidSimulado = null;
    expect((await listar()).status).toBe(401);
  });

  it("crea un grupo con código de 6 caracteres y lo lista", async () => {
    const g = await grupoCreado();
    expect(g.codigo).toMatch(/^[A-Z2-9]{6}$/);
    const lista = await (await listar()).json();
    expect(lista).toHaveLength(1);
  });

  it("rechaza un nombre vacío con 422", async () => {
    const r = await crear(json({ nombre: " ", tuNombre: "Ana" }));
    expect(r.status).toBe(422);
  });

  it("rechaza un cuerpo que no es JSON con 400", async () => {
    const r = await crear(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { origin: "http://localhost" },
        body: "hola",
      }),
    );
    expect(r.status).toBe(400);
  });

  it("unirse con código inexistente responde 404", async () => {
    const r = await unirse(json({ codigo: "ZZZZZZ", tuNombre: "Beto" }));
    expect(r.status).toBe(404);
  });

  it("un usuario ajeno recibe 404 al registrar gastos o exportar", async () => {
    const g = await grupoCreado();
    uidSimulado = "intruso";
    const cuerpo = {
      descripcion: "x",
      montoCentavos: 100,
      pagadorUid: "ana",
      participantes: ["ana"],
    };
    expect((await gasto(json(cuerpo), ctx(g.id))).status).toBe(404);
    expect((await exportar(new Request("http://localhost"), ctx(g.id))).status).toBe(404);
  });
});

describe("flujo completo (integración)", () => {
  it("crear, unirse, registrar gasto, pagar y exportar", async () => {
    const g = await grupoCreado();
    uidSimulado = "beto";
    expect((await unirse(json({ codigo: g.codigo.toLowerCase(), tuNombre: "Beto" }))).status).toBe(
      200,
    );

    uidSimulado = "ana";
    const nuevo = {
      descripcion: "Mercado",
      montoCentavos: 40000,
      pagadorUid: "ana",
      participantes: ["ana", "beto"],
    };
    expect((await gasto(json(nuevo), ctx(g.id))).status).toBe(201);
    expect(
      (await pago(json({ deUid: "beto", aUid: "ana", montoCentavos: 20000 }), ctx(g.id))).status,
    ).toBe(201);

    const csv = await (await exportar(new Request("http://localhost"), ctx(g.id))).text();
    expect(csv).toContain("gasto");
    expect(csv).toContain("Mercado");
    expect(csv).toContain("pago");
  });

  it("rechaza gastos con personas que no son del grupo (422) y porcentajes que no suman 100", async () => {
    const g = await grupoCreado();
    const ajeno = {
      descripcion: "x",
      montoCentavos: 100,
      pagadorUid: "ana",
      participantes: ["ana", "otro"],
    };
    expect((await gasto(json(ajeno), ctx(g.id))).status).toBe(422);
    const mal = {
      descripcion: "x",
      montoCentavos: 100,
      pagadorUid: "ana",
      participantes: ["ana"],
      porcentajes: { ana: 50 },
    };
    expect((await gasto(json(mal), ctx(g.id))).status).toBe(422);
  });

  it("el CSV neutraliza fórmulas en la descripción", async () => {
    const g = await grupoCreado();
    const peligro = {
      descripcion: '=HYPERLINK("x")',
      montoCentavos: 100,
      pagadorUid: "ana",
      participantes: ["ana"],
    };
    await gasto(json(peligro), ctx(g.id));
    const csv = await (await exportar(new Request("http://localhost"), ctx(g.id))).text();
    expect(csv).toContain("'=HYPERLINK");
  });
});

describe("seguridad: Origin y autorización por objeto", () => {
  const cuerpo = JSON.stringify({ nombre: "Paseo", tuNombre: "Ana" });
  const conOrigen = (origin?: string) =>
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
      body: cuerpo,
    });

  it("rechaza con 403 una petición sin Origin o con un Origin de otro sitio", async () => {
    expect((await crear(conOrigen())).status).toBe(403);
    expect((await crear(conOrigen("https://sitio-malicioso.com"))).status).toBe(403);
    expect((await crear(conOrigen("no-es-una-url"))).status).toBe(403);
    expect((await listar()).status).toBe(200);
  });

  it("acepta el Origin del mismo host (también detrás de un proxy)", async () => {
    expect((await crear(conOrigen("http://localhost"))).status).toBe(201);
    const proxied = new Request("http://interno/api", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://miapp.vercel.app",
        "x-forwarded-host": "miapp.vercel.app",
      },
      body: cuerpo,
    });
    expect((await crear(proxied)).status).toBe(201);
  });

  it("un miembro no puede registrar un pago entre otras dos personas (403); el admin sí", async () => {
    const g = await grupoCreado();
    for (const [uid, nombre] of [
      ["beto", "Beto"],
      ["carla", "Carla"],
    ]) {
      uidSimulado = uid;
      await unirse(json({ codigo: g.codigo, tuNombre: nombre }));
    }
    const entreOtros = { deUid: "ana", aUid: "carla", montoCentavos: 1000 };
    uidSimulado = "beto";
    expect((await pago(json(entreOtros), ctx(g.id))).status).toBe(403);
    expect(
      (await pago(json({ deUid: "beto", aUid: "ana", montoCentavos: 1000 }), ctx(g.id))).status,
    ).toBe(201);
    uidSimulado = "ana";
    expect(
      (await pago(json({ deUid: "beto", aUid: "carla", montoCentavos: 500 }), ctx(g.id))).status,
    ).toBe(201);
  });
});
