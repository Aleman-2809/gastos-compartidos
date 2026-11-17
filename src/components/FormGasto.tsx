"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "@/lib/cliente";

type Props = { grupoId: string; miembros: Record<string, string> };

export default function FormGasto({ grupoId, miembros }: Props) {
  const router = useRouter();
  const uids = Object.keys(miembros);
  const [modo, setModo] = useState<"iguales" | "porcentajes">("iguales");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const participantes = uids.filter((u) => f.get(`part-${u}`) === "on");
    if (participantes.length === 0) return setError("Elige al menos un participante");
    const cuerpo: Record<string, unknown> = {
      descripcion: f.get("descripcion"),
      montoCentavos: Math.round(Number(f.get("monto")) * 100),
      pagadorUid: f.get("pagador"),
      participantes,
    };
    if (modo === "porcentajes") {
      const porcentajes = Object.fromEntries(
        participantes.map((u) => [u, Number(f.get(`pct-${u}`) || 0)]),
      );
      const total = Object.values(porcentajes).reduce((a, b) => a + b, 0);
      if (Math.round(total * 100) !== 10000)
        return setError(`Los porcentajes suman ${total}, deben sumar 100`);
      cuerpo.porcentajes = porcentajes;
    }
    setEnviando(true);
    setError("");
    const r = await enviarJson(`/api/grupos/${grupoId}/gastos`, cuerpo);
    if (r.ok) {
      router.push(`/grupos/${grupoId}`);
      router.refresh();
    } else {
      setError(r.error);
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Descripción
        <input name="descripcion" type="text" required maxLength={80} />
      </label>
      <label>
        Monto (COP)
        <input name="monto" type="number" required min="0.01" step="0.01" inputMode="decimal" />
      </label>
      <label>
        ¿Quién pagó?
        <select name="pagador" defaultValue={uids[0]}>
          {uids.map((u) => (
            <option key={u} value={u}>
              {miembros[u]}
            </option>
          ))}
        </select>
      </label>
      <label>
        ¿Cómo se reparte?
        <select value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}>
          <option value="iguales">En partes iguales</option>
          <option value="porcentajes">Por porcentajes</option>
        </select>
      </label>
      <fieldset>
        <legend>Participantes</legend>
        {uids.map((u) => (
          <div key={u} className="participante">
            <label>
              <input type="checkbox" name={`part-${u}`} defaultChecked /> {miembros[u]}
            </label>
            {modo === "porcentajes" && (
              <label>
                <span className="solo-lectores">Porcentaje de {miembros[u]}</span>
                <input
                  name={`pct-${u}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="%"
                />
              </label>
            )}
          </div>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando}>
        Guardar gasto
      </button>
    </form>
  );
}
