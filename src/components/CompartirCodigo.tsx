"use client";
import { useState } from "react";

export default function CompartirCodigo({ codigo, nombre }: { codigo: string; nombre: string }) {
  const [mensaje, setMensaje] = useState("");
  const puedeCompartir = typeof navigator !== "undefined" && "share" in navigator;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setMensaje("Código copiado");
    } catch {
      setMensaje("No se pudo copiar; selecciona el código y cópialo a mano");
    }
  }
  async function compartir() {
    try {
      await navigator.share({ title: nombre, text: `Únete a «${nombre}» con el código ${codigo}` });
    } catch {}
  }

  return (
    <div className="codigo">
      <p>
        Código para unirse: <strong>{codigo}</strong>
      </p>
      <button type="button" onClick={copiar}>
        Copiar código
      </button>
      {puedeCompartir && (
        <button type="button" onClick={compartir}>
          Compartir
        </button>
      )}
      <p role="status">{mensaje}</p>
    </div>
  );
}
