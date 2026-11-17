import type { Grupo } from "./repositorio";

function celda(valor: string | number): string {
  let t = String(valor);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}
const pesos = (centavos: number) => (centavos / 100).toFixed(2);

export function grupoACsv(g: Grupo): string {
  const filas: (string | number)[][] = [["tipo", "fecha", "descripcion", "de", "a", "monto_cop"]];
  for (const x of g.gastos) {
    filas.push([
      "gasto",
      x.creadoEn,
      x.descripcion,
      g.miembros[x.pagadorUid] ?? x.pagadorUid,
      "",
      pesos(x.montoCentavos),
    ]);
  }
  for (const p of g.pagos) {
    filas.push([
      "pago",
      p.creadoEn,
      "Pago registrado",
      g.miembros[p.deUid] ?? p.deUid,
      g.miembros[p.aUid] ?? p.aUid,
      pesos(p.montoCentavos),
    ]);
  }
  return filas.map((f) => f.map(celda).join(",")).join("\n") + "\n";
}
