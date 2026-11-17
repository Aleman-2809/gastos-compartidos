import { cache } from "react";
import { getRepo } from "./repositorio";
import { uidActual } from "./sesion";

export const grupoDelUsuario = cache(async (id: string) => {
  const uid = await uidActual();
  return uid ? (await getRepo()).obtenerGrupo(id, uid) : null;
});
