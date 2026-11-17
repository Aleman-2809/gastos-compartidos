import type { Metadata } from "next";
import FormGrupo from "@/components/FormGrupo";

export const metadata: Metadata = { title: "Nuevo grupo · Gastos compartidos" };

export default function NuevoGrupoPage() {
  return (
    <>
      <h1>Crear un grupo</h1>
      <FormGrupo />
    </>
  );
}
