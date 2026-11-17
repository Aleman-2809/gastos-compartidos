import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repositorio";
import { crearGastoSchema } from "@/lib/schemas";
import { leerCuerpo, noEncontrado, sinSesion, uidActual, verificarOrigen } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const { id } = await params;
  const repo = await getRepo();
  const grupo = await repo.obtenerGrupo(id, uid);
  if (!grupo) return noEncontrado("Grupo no encontrado");
  const { datos, error } = await leerCuerpo(req, crearGastoSchema);
  if (error) return error;
  const ajenos = [datos.pagadorUid, ...datos.participantes].filter((u) => !(u in grupo.miembros));
  if (ajenos.length > 0) {
    return NextResponse.json(
      { error: "Hay personas que no son miembros del grupo" },
      { status: 422 },
    );
  }
  const gasto = await repo.agregarGasto(id, uid, datos);
  return NextResponse.json(gasto, { status: 201 });
}
