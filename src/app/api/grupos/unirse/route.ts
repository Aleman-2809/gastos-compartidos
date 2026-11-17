import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repositorio";
import { unirseSchema } from "@/lib/schemas";
import { leerCuerpo, noEncontrado, sinSesion, uidActual, verificarOrigen } from "@/lib/api";

export async function POST(req: Request) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const { datos, error } = await leerCuerpo(req, unirseSchema);
  if (error) return error;
  const grupo = await (await getRepo()).unirse(datos.codigo, uid, datos.tuNombre);
  if (!grupo) return noEncontrado("No existe un grupo con ese código");
  return NextResponse.json(grupo);
}
