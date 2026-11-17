import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hayFirebase } from "@/lib/firebase-admin";
import { getRepo } from "@/lib/repositorio";
import { uidActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mis grupos · Gastos compartidos" };

export default async function GruposPage() {
  const uid = await uidActual();
  if (!uid && hayFirebase()) redirect("/entrar");
  const grupos = uid ? await (await getRepo()).listarGrupos(uid) : [];
  return (
    <>
      <h1>Mis grupos</h1>
      <p>
        <Link href="/grupos/nuevo">Crear un grupo</Link> ·{" "}
        <Link href="/unirse">Unirme con un código</Link>
      </p>
      {grupos.length === 0 ? (
        <p>Todavía no perteneces a ningún grupo.</p>
      ) : (
        <ul>
          {grupos.map((g) => (
            <li key={g.id}>
              <Link href={`/grupos/${g.id}`}>{g.nombre}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
