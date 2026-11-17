import { describe, it, expect } from "vitest";
import {
  repartirEnPartesIguales,
  repartirPorPorcentajes,
  calcularBalances,
  pagosMinimos,
} from "./gastos";

const suma = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe("repartirEnPartesIguales", () => {
  it("reparte 100000 entre 3 y las partes suman exactamente 100000", () => {
    const partes = repartirEnPartesIguales(100000, ["a", "b", "c"]);
    expect(partes).toEqual({ a: 33334, b: 33333, c: 33333 });
    expect(suma(partes)).toBe(100000);
  });

  it.each([
    [10000, ["a", "b", "c"], { a: 3334, b: 3333, c: 3333 }],
    [100, ["a", "b", "c"], { a: 34, b: 33, c: 33 }],
    [1, ["a", "b", "c"], { a: 1, b: 0, c: 0 }],
    [100, ["c", "a", "b"], { a: 34, b: 33, c: 33 }],
  ])("reparte %i entre %j sin perder ni inventar centavos", (monto, quienes, esperado) => {
    const partes = repartirEnPartesIguales(monto, quienes);
    expect(partes).toEqual(esperado);
    expect(suma(partes)).toBe(monto);
  });

  it("rechaza montos no enteros, menores o iguales a 0, y sin participantes", () => {
    expect(() => repartirEnPartesIguales(0, ["a"])).toThrow();
    expect(() => repartirEnPartesIguales(10.5, ["a"])).toThrow();
    expect(() => repartirEnPartesIguales(100, [])).toThrow();
  });
});

describe("repartirPorPorcentajes", () => {
  it("reparte 50/30/20 de 10000 sin perder centavos", () => {
    expect(repartirPorPorcentajes(10000, { a: 50, b: 30, c: 20 })).toEqual({
      a: 5000,
      b: 3000,
      c: 2000,
    });
  });

  it("con 33,33/33,33/33,34 las partes suman exactamente el monto", () => {
    const partes = repartirPorPorcentajes(100001, { a: 33.33, b: 33.33, c: 33.34 });
    expect(suma(partes)).toBe(100001);
  });

  it("rechaza porcentajes que no suman 100", () => {
    expect(() => repartirPorPorcentajes(1000, { a: 60, b: 30 })).toThrow("sumar 100");
  });
});

describe("calcularBalances", () => {
  it("con 4 personas el balance suma 0", () => {
    const balances = calcularBalances([
      { pagadorUid: "ana", montoCentavos: 40000, participantes: ["ana", "beto", "caro", "dani"] },
    ]);
    expect(balances).toEqual({ ana: 30000, beto: -10000, caro: -10000, dani: -10000 });
    expect(suma(balances)).toBe(0);
  });

  it("usa porcentajes cuando el gasto los trae", () => {
    const balances = calcularBalances([
      {
        pagadorUid: "ana",
        montoCentavos: 10000,
        participantes: ["ana", "beto"],
        porcentajes: { ana: 20, beto: 80 },
      },
    ]);
    expect(balances).toEqual({ ana: 8000, beto: -8000 });
  });

  it("los pagos registrados reducen la deuda", () => {
    const gastos = [{ pagadorUid: "ana", montoCentavos: 40000, participantes: ["ana", "beto"] }];
    const balances = calcularBalances(gastos, [
      { deUid: "beto", aUid: "ana", montoCentavos: 20000 },
    ]);
    expect(balances).toEqual({ ana: 0, beto: 0 });
  });
});

describe("pagosMinimos", () => {
  it("los pagos sugeridos saldan todas las deudas", () => {
    const gastos = [
      { pagadorUid: "ana", montoCentavos: 40000, participantes: ["ana", "beto", "caro", "dani"] },
    ];
    const pagos = pagosMinimos(calcularBalances(gastos));
    expect(pagos).toHaveLength(3);
    const saldado = calcularBalances(gastos, pagos);
    expect(Object.values(saldado).every((v) => v === 0)).toBe(true);
  });

  it("encuentra el mínimo cuando el método voraz no lo logra (4 pagos, no 5)", () => {
    const balances = { p: 5, q: 5, x: -3, y: -3, z: -4 };
    const pagos = pagosMinimos(balances);
    expect(pagos).toHaveLength(4);
    const neto: Record<string, number> = { ...balances };
    for (const p of pagos) {
      neto[p.deUid] += p.montoCentavos;
      neto[p.aUid] -= p.montoCentavos;
    }
    expect(Object.values(neto).every((v) => v === 0)).toBe(true);
  });

  it("separa grupos independientes: dos parejas se saldan con 2 pagos", () => {
    const pagos = pagosMinimos({ a: 10, b: -10, c: 7, d: -7 });
    expect(pagos).toHaveLength(2);
  });

  it("sin deudas no hay pagos", () => {
    expect(pagosMinimos({ a: 0, b: 0 })).toEqual([]);
  });

  it("con más personas que el límite exacto sigue saldando todo", () => {
    const balances: Record<string, number> = {};
    for (let i = 0; i < 18; i++)
      balances[`u${String(i).padStart(2, "0")}`] = i % 2 === 0 ? 100 : -100;
    const pagos = pagosMinimos(balances);
    const neto = { ...balances };
    for (const p of pagos) {
      neto[p.deUid] += p.montoCentavos;
      neto[p.aUid] -= p.montoCentavos;
    }
    expect(Object.values(neto).every((v) => v === 0)).toBe(true);
  });
});
