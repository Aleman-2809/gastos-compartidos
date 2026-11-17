"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "@/lib/cliente";

export default function FormGrupo() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    const r = await enviarJson<{ id: string }>("/api/grupos", {
      nombre: f.get("nombre"),
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
        Nombre del grupo
        <input name="nombre" type="text" required maxLength={60} autoComplete="off" />
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
        Crear grupo
      </button>
    </form>
  );
}
