"use client";
import { useRouter } from "next/navigation";
import { authConfigurado } from "@/lib/firebase-cliente";

export default function BotonSalir() {
  const router = useRouter();
  if (!authConfigurado()) return null;
  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" }).catch(() => undefined);
    router.push("/entrar");
    router.refresh();
  }
  return (
    <button type="button" onClick={salir}>
      Salir
    </button>
  );
}
