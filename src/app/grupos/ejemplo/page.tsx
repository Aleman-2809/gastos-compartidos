import type { Metadata } from "next";
import { calcularBalances, pagosMinimos } from "@/services/gastos";
import { grupoEjemplo } from "@/data/grupo-ejemplo";

export const metadata: Metadata = { title: "Paseo a Guatapé · Gastos compartidos" };

const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" });
const formatear = (centavos: number) => moneda.format(centavos / 100);

export default function GrupoEjemploPage() {
  const { nombre, miembros, gastos } = grupoEjemplo;
  const balances = calcularBalances(gastos);
  const pagos = pagosMinimos(balances);

  return (
    <>
      <h1>{nombre}</h1>

      <section aria-labelledby="titulo-gastos">
        <h2 id="titulo-gastos">Gastos</h2>
        {gastos.length === 0 ? (
          <p>Todavía no hay gastos registrados.</p>
        ) : (
          <div className="tabla-scroll">
            <table>
              <caption>Gastos registrados en el grupo</caption>
              <thead>
                <tr>
                  <th scope="col">Descripción</th>
                  <th scope="col">Pagó</th>
                  <th scope="col">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <th scope="row">{g.descripcion}</th>
                    <td>{miembros[g.pagadorUid]}</td>
                    <td className="monto">{formatear(g.montoCentavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-balances">
        <h2 id="titulo-balances">Balance por persona</h2>
        <div className="tabla-scroll">
          <table>
            <caption>Cuánto le deben o debe cada persona</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Estado</th>
                <th scope="col">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(balances).map(([uid, b]) => (
                <tr key={uid}>
                  <th scope="row">{miembros[uid]}</th>
                  <td className={b > 0 ? "le-deben" : b < 0 ? "deben" : undefined}>
                    {b > 0 ? "Le deben" : b < 0 ? "Debe" : "Al día"}
                  </td>
                  <td className="monto">{formatear(Math.abs(b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-pagos">
        <h2 id="titulo-pagos">Pagos sugeridos para saldar</h2>
        {pagos.length === 0 ? (
          <p>No hay deudas pendientes.</p>
        ) : (
          <ul>
            {pagos.map((p) => (
              <li key={`${p.deUid}-${p.aUid}`}>
                {miembros[p.deUid]} le paga {formatear(p.montoCentavos)} a {miembros[p.aUid]}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
