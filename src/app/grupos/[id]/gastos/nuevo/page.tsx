import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FormGasto from "@/components/FormGasto";
import { grupoDelUsuario } from "@/lib/grupo-actual";

export const metadata: Metadata = { title: "Nuevo gasto · Gastos compartidos" };

export default async function NuevoGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grupo = await grupoDelUsuario(id);
  if (!grupo) notFound();
  return (
    <>
      <h1>Registrar un gasto en «{grupo.nombre}»</h1>
      <FormGasto grupoId={id} miembros={grupo.miembros} />
    </>
  );
}
