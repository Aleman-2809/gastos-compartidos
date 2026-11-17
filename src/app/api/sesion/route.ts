import { NextResponse } from "next/server";
import { appAdmin, hayFirebase } from "@/lib/firebase-admin";
import { sesionSchema } from "@/lib/schemas";
import { COOKIE_SESION, DURACION_SESION_MS } from "@/lib/sesion";
import { leerCuerpo, verificarOrigen } from "@/lib/api";

const noConfigurado = () =>
  NextResponse.json(
    { error: "La autenticación con Firebase no está configurada" },
    { status: 501 },
  );

export async function POST(req: Request) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  if (!hayFirebase()) return noConfigurado();
  const { datos, error } = await leerCuerpo(req, sesionSchema);
  if (error) return error;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth(appAdmin());
    const decodificado = await auth.verifyIdToken(datos.idToken);
    if (Date.now() / 1000 - decodificado.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Vuelve a iniciar sesión" }, { status: 401 });
    }
    const cookie = await auth.createSessionCookie(datos.idToken, { expiresIn: DURACION_SESION_MS });
    const respuesta = NextResponse.json({ uid: decodificado.uid });
    respuesta.cookies.set(COOKIE_SESION, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: DURACION_SESION_MS / 1000,
    });
    return respuesta;
  } catch {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  const origenMalo = verificarOrigen(req);
  if (origenMalo) return origenMalo;
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return respuesta;
}
