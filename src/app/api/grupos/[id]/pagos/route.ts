import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repositorio";
import { crearPagoSchema } from "@/lib/schemas";
import {
  leerCuerpo,
  noEncontrado,
  prohibido,
  sinSesion,
  uidActual,
  verificarOrigen,
} from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const { id } = await params;
  const repo = await getRepo();
  const grupo = await repo.obtenerGrupo(id, uid);
  if (!grupo) return noEncontrado("Grupo no encontrado");
  const { datos, error } = await leerCuerpo(req, crearPagoSchema);
  if (error) return error;
  if (!(datos.deUid in grupo.miembros) || !(datos.aUid in grupo.miembros)) {
    return NextResponse.json(
      { error: "Hay personas que no son miembros del grupo" },
      { status: 422 },
    );
  }
  const esAdmin = grupo.roles?.[uid] === "admin";
  if (!esAdmin && uid !== datos.deUid && uid !== datos.aUid) {
    return prohibido("Solo quien paga, quien recibe o un administrador puede registrar este pago");
  }
  const pago = await repo.agregarPago(id, uid, datos);
  return NextResponse.json(pago, { status: 201 });
}
