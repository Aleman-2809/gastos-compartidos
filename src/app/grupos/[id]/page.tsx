import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompartirCodigo from "@/components/CompartirCodigo";
import PagosSugeridos from "@/components/PagosSugeridos";
import { grupoDelUsuario } from "@/lib/grupo-actual";
import { formatear } from "@/lib/cliente";
import { calcularBalances, pagosMinimos } from "@/services/gastos";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const grupo = await grupoDelUsuario(id);
  return { title: `${grupo?.nombre ?? "Grupo"} · Gastos compartidos` };
}

export default async function GrupoPage({ params }: Props) {
  const { id } = await params;
  const grupo = await grupoDelUsuario(id);
  if (!grupo) notFound();

  const { nombre, miembros, gastos, pagos } = grupo;
  const balances = calcularBalances(gastos, pagos);
  const sugeridos = pagosMinimos(balances);

  return (
    <>
      <h1>{nombre}</h1>
      <CompartirCodigo codigo={grupo.codigo} nombre={nombre} />
      <p>
        <Link href={`/grupos/${id}/gastos/nuevo`}>Registrar un gasto</Link> ·{" "}
        <a href={`/api/grupos/${id}/exportar`} download>
          Exportar a CSV
        </a>
      </p>

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
              {Object.keys(miembros).map((u) => {
                const b = balances[u] ?? 0;
                return (
                  <tr key={u}>
                    <th scope="row">{miembros[u]}</th>
                    <td className={b > 0 ? "le-deben" : b < 0 ? "deben" : undefined}>
                      {b > 0 ? "Le deben" : b < 0 ? "Debe" : "Al día"}
                    </td>
                    <td className="monto">{formatear(Math.abs(b))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-pagos">
        <h2 id="titulo-pagos">Pagos sugeridos para saldar</h2>
        <PagosSugeridos grupoId={id} pagos={sugeridos} miembros={miembros} />
      </section>

      {pagos.length > 0 && (
        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial">Pagos registrados</h2>
          <ul>
            {pagos.map((p) => (
              <li key={p.id}>
                {miembros[p.deUid]} pagó {formatear(p.montoCentavos)} a {miembros[p.aUid]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
