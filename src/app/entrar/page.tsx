import type { Metadata } from "next";
import FormEntrar from "@/components/FormEntrar";

export const metadata: Metadata = { title: "Entrar · Gastos compartidos" };

export default function EntrarPage() {
  return (
    <>
      <h1>Entrar</h1>
      <p>Inicia sesión para ver tus grupos y registrar gastos.</p>
      <FormEntrar />
    </>
  );
}
