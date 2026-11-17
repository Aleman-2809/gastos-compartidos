"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "@/lib/cliente";

export default function FormUnirse() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    const r = await enviarJson<{ id: string }>("/api/grupos/unirse", {
      codigo: f.get("codigo"),
      tuNombre: f.get("tuNombre"),
    });
    if (r.ok) router.push(`/grupos/${r.datos.id}`);
    else {
      setError(r.error);
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Código del grupo
        <input name="codigo" type="text" required minLength={6} maxLength={6} autoComplete="off" />
      </label>
      <label>
        Tu nombre en el grupo
        <input name="tuNombre" type="text" required maxLength={60} autoComplete="given-name" />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando}>
        Unirme
      </button>
    </form>
  );
}
