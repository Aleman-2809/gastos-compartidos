import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repositorio";
import { crearGrupoSchema } from "@/lib/schemas";
import { leerCuerpo, sinSesion, uidActual, verificarOrigen } from "@/lib/api";

export async function GET() {
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const grupos = await (await getRepo()).listarGrupos(uid);
  return NextResponse.json(grupos.map(({ id, nombre, codigo }) => ({ id, nombre, codigo })));
}

export async function POST(req: Request) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const { datos, error } = await leerCuerpo(req, crearGrupoSchema);
  if (error) return error;
  const grupo = await (await getRepo()).crearGrupo(uid, datos.tuNombre, datos.nombre);
  return NextResponse.json(grupo, { status: 201 });
}
