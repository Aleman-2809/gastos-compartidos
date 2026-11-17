"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authCliente, authConfigurado } from "@/lib/firebase-cliente";
import { enviarJson } from "@/lib/cliente";

const MENSAJES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos",
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
  "auth/invalid-email": "El correo no es válido",
};

export default function FormEntrar() {
  const router = useRouter();
  const [crear, setCrear] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!authConfigurado()) {
    return (
      <p role="status">
        La autenticación con Firebase no está configurada: la aplicación funciona en modo
        demostración con una identidad anónima.
      </p>
    );
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const correo = String(f.get("correo") ?? "");
    const clave = String(f.get("clave") ?? "");
    setEnviando(true);
    setError("");
    try {
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } =
        await import("firebase/auth");
      const credencial = await (crear
        ? createUserWithEmailAndPassword(authCliente(), correo, clave)
        : signInWithEmailAndPassword(authCliente(), correo, clave));
      const r = await enviarJson("/api/sesion", { idToken: await credencial.user.getIdToken() });
      if (!r.ok) throw new Error(r.error);
      router.push("/grupos");
      router.refresh();
    } catch (err) {
      const codigo = (err as { code?: string }).code ?? "";
      setError(MENSAJES[codigo] ?? (err as Error).message ?? "No se pudo iniciar sesión");
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Correo electrónico
        <input name="correo" type="email" required autoComplete="email" />
      </label>
      <label>
        Contraseña
        <input
          name="clave"
          type="password"
          required
          minLength={6}
          autoComplete={crear ? "new-password" : "current-password"}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando}>
        {crear ? "Crear cuenta" : "Entrar"}
      </button>
      <button type="button" onClick={() => setCrear(!crear)}>
        {crear ? "Ya tengo cuenta" : "No tengo cuenta"}
      </button>
    </form>
  );
}
