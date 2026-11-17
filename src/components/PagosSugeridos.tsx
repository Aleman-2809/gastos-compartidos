"use client";
import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { enviarJson, formatear } from "@/lib/cliente";
import type { Pago } from "@/services/gastos";

type Props = { grupoId: string; pagos: Pago[]; miembros: Record<string, string> };
const clave = (p: Pago) => `${p.deUid}>${p.aUid}`;

export default function PagosSugeridos({ grupoId, pagos, miembros }: Props) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [elegido, setElegido] = useState<Pago | null>(null);
  const [error, setError] = useState("");
  const [, iniciar] = useTransition();
  const [visibles, quitar] = useOptimistic(pagos, (estado, k: string) =>
    estado.filter((p) => clave(p) !== k),
  );

  function abrir(p: Pago) {
    setElegido(p);
    if (typeof dialogo.current?.showModal === "function") dialogo.current.showModal();
    else dialogo.current?.setAttribute("open", "");
  }
  function cerrar() {
    if (typeof dialogo.current?.close === "function") dialogo.current.close();
    else dialogo.current?.removeAttribute("open");
  }
  function confirmar() {
    const p = elegido;
    cerrar();
    if (!p) return;
    iniciar(async () => {
      quitar(clave(p));
      const r = await enviarJson(`/api/grupos/${grupoId}/pagos`, p);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  }

  if (visibles.length === 0) return <p>No hay deudas pendientes.</p>;
  return (
    <>
      <ul>
        {visibles.map((p) => (
          <li key={clave(p)}>
            {miembros[p.deUid]} le paga {formatear(p.montoCentavos)} a {miembros[p.aUid]}{" "}
            <button type="button" onClick={() => abrir(p)}>
              Registrar pago
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <dialog ref={dialogo} aria-labelledby="titulo-dialogo">
        <h3 id="titulo-dialogo">Confirmar pago</h3>
        {elegido && (
          <p>
            ¿{miembros[elegido.deUid]} ya le pagó {formatear(elegido.montoCentavos)} a{" "}
            {miembros[elegido.aUid]}?
          </p>
        )}
        <button type="button" onClick={confirmar}>
          Sí, registrar
        </button>
        <button type="button" onClick={cerrar}>
          Cancelar
        </button>
      </dialog>
    </>
  );
}
