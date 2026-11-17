import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { uidActual } from "./sesion";

export const sinSesion = () => NextResponse.json({ error: "Sin sesión" }, { status: 401 });
export const noEncontrado = (mensaje = "No encontrado") =>
  NextResponse.json({ error: mensaje }, { status: 404 });

export const prohibido = (mensaje = "No tienes permiso para hacer esto") =>
  NextResponse.json({ error: mensaje }, { status: 403 });

export function verificarOrigen(req: Request): NextResponse | null {
  const origen = req.headers.get("origin");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  try {
    if (origen && new URL(origen).host === host) return null;
  } catch {}
  return prohibido("Origen no permitido");
}

export async function leerCuerpo<T>(req: Request, schema: ZodType<T>) {
  const crudo = await req.json().catch(() => undefined);
  if (crudo === undefined) {
    return { error: NextResponse.json({ error: "El cuerpo debe ser JSON" }, { status: 400 }) };
  }
  const r = schema.safeParse(crudo);
  if (!r.success) {
    return {
      error: NextResponse.json(
        { error: r.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 422 },
      ),
    };
  }
  return { datos: r.data };
}

export { uidActual };
