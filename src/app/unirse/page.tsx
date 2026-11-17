import type { Metadata } from "next";
import FormUnirse from "@/components/FormUnirse";

export const metadata: Metadata = { title: "Unirme a un grupo · Gastos compartidos" };

export default function UnirsePage() {
  return (
    <>
      <h1>Unirme a un grupo</h1>
      <p>Pídele el código de 6 caracteres a quien creó el grupo.</p>
      <FormUnirse />
    </>
  );
}
