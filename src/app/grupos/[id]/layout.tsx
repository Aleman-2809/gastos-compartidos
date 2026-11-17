import { notFound } from "next/navigation";
import { grupoDelUsuario } from "@/lib/grupo-actual";

export default async function GrupoLayout({ children, params }: LayoutProps<"/grupos/[id]">) {
  const { id } = await params;
  if (!(await grupoDelUsuario(id))) notFound();
  return children;
}
