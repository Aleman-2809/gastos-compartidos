import { cookies } from "next/headers";
import { hayFirebase } from "./firebase-admin";

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;

export async function uidActual(): Promise<string | null> {
  const almacen = await cookies();
  if (!hayFirebase()) return almacen.get("uid")?.value ?? null;
  const sesion = almacen.get(COOKIE_SESION)?.value;
  if (!sesion) return null;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const { appAdmin } = await import("./firebase-admin");
    return (await getAuth(appAdmin()).verifySessionCookie(sesion, true)).uid;
  } catch {
    return null;
  }
}
