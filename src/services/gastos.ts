export type Gasto = {
  pagadorUid: string;
  montoCentavos: number;
  participantes: string[];
  porcentajes?: Record<string, number>;
};

export type Pago = { deUid: string; aUid: string; montoCentavos: number };

export function repartirEnPartesIguales(
  montoCentavos: number,
  participantes: string[],
): Record<string, number> {
  if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) {
    throw new Error("El monto debe ser un entero mayor que 0");
  }
  if (participantes.length === 0) {
    throw new Error("Debe haber al menos un participante");
  }
  const ordenados = [...participantes].sort();
  const base = Math.floor(montoCentavos / ordenados.length);
  const resto = montoCentavos % ordenados.length;
  const partes: Record<string, number> = {};
  ordenados.forEach((uid, i) => {
    partes[uid] = base + (i < resto ? 1 : 0);
  });
  return partes;
}

export function repartirPorPorcentajes(
  montoCentavos: number,
  porcentajes: Record<string, number>,
): Record<string, number> {
  if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) {
    throw new Error("El monto debe ser un entero mayor que 0");
  }
  const uids = Object.keys(porcentajes).sort();
  if (uids.length === 0) throw new Error("Debe haber al menos un participante");
  const puntosBase = uids.map((uid) => Math.round(porcentajes[uid] * 100));
  if (puntosBase.some((p) => p < 0) || puntosBase.reduce((a, b) => a + b, 0) !== 10000) {
    throw new Error("Los porcentajes deben sumar 100");
  }
  const cuotas = uids.map((uid, i) => {
    const numerador = montoCentavos * puntosBase[i];
    return { uid, base: Math.floor(numerador / 10000), resto: numerador % 10000 };
  });
  let faltan = montoCentavos - cuotas.reduce((a, c) => a + c.base, 0);
  [...cuotas]
    .sort((a, b) => b.resto - a.resto || a.uid.localeCompare(b.uid))
    .forEach((c) => {
      if (faltan > 0) {
        c.base += 1;
        faltan -= 1;
      }
    });
  return Object.fromEntries(cuotas.map((c) => [c.uid, c.base]));
}

export function calcularBalances(gastos: Gasto[], pagos: Pago[] = []): Record<string, number> {
  const balances: Record<string, number> = {};
  const sumar = (uid: string, valor: number) => {
    balances[uid] = (balances[uid] ?? 0) + valor;
  };
  for (const g of gastos) {
    sumar(g.pagadorUid, g.montoCentavos);
    const partes = g.porcentajes
      ? repartirPorPorcentajes(g.montoCentavos, g.porcentajes)
      : repartirEnPartesIguales(g.montoCentavos, g.participantes);
    for (const [uid, parte] of Object.entries(partes)) sumar(uid, -parte);
  }
  for (const p of pagos) {
    sumar(p.deUid, p.montoCentavos);
    sumar(p.aUid, -p.montoCentavos);
  }
  return balances;
}

type Saldo = [uid: string, centavos: number];

export const LIMITE_EXACTO = 16;

export function pagosMinimos(balances: Record<string, number>): Pago[] {
  const saldos: Saldo[] = Object.entries(balances)
    .filter(([, b]) => b !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (saldos.length === 0) return [];
  const grupos = saldos.length <= LIMITE_EXACTO ? particionExacta(saldos) : [saldos];
  return grupos.flatMap(saldarGrupo);
}

function particionExacta(saldos: Saldo[]): Saldo[][] {
  const n = saldos.length;
  const total = 1 << n;
  const suma = new Float64Array(total);
  const grupos = new Int16Array(total);
  const ultimo = new Int8Array(total);
  for (let mascara = 1; mascara < total; mascara++) {
    const bajo = 31 - Math.clz32(mascara & -mascara);
    suma[mascara] = suma[mascara & (mascara - 1)] + saldos[bajo][1];
    let mejor = -1;
    let mejorI = 0;
    for (let i = 0; i < n; i++) {
      if (mascara & (1 << i)) {
        const v = grupos[mascara ^ (1 << i)];
        if (v > mejor) {
          mejor = v;
          mejorI = i;
        }
      }
    }
    grupos[mascara] = mejor + (suma[mascara] === 0 ? 1 : 0);
    ultimo[mascara] = mejorI;
  }
  const orden: number[] = [];
  for (let m = total - 1; m > 0; m ^= 1 << ultimo[m]) orden.push(ultimo[m]);
  orden.reverse();
  const resultado: Saldo[][] = [];
  let actual: Saldo[] = [];
  let acumulado = 0;
  for (const i of orden) {
    actual.push(saldos[i]);
    acumulado += saldos[i][1];
    if (acumulado === 0) {
      resultado.push(actual);
      actual = [];
    }
  }
  return resultado;
}

function saldarGrupo(saldos: Saldo[]): Pago[] {
  const deudores = saldos.filter(([, b]) => b < 0).map(([uid, b]) => ({ uid, monto: -b }));
  const acreedores = saldos.filter(([, b]) => b > 0).map(([uid, b]) => ({ uid, monto: b }));
  const orden = (x: { uid: string; monto: number }, y: { uid: string; monto: number }) =>
    y.monto - x.monto || x.uid.localeCompare(y.uid);
  deudores.sort(orden);
  acreedores.sort(orden);

  const resultado: Pago[] = [];
  let i = 0;
  let j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const monto = Math.min(deudores[i].monto, acreedores[j].monto);
    resultado.push({ deUid: deudores[i].uid, aUid: acreedores[j].uid, montoCentavos: monto });
    deudores[i].monto -= monto;
    acreedores[j].monto -= monto;
    if (deudores[i].monto === 0) i++;
    if (acreedores[j].monto === 0) j++;
  }
  return resultado;
}
