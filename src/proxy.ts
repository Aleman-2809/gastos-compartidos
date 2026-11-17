import { NextResponse, type NextRequest } from "next/server";

export const esRutaPrivada = (ruta: string) =>
  (ruta === "/grupos" || ruta.startsWith("/grupos/") || ruta === "/unirse") &&
  !ruta.startsWith("/grupos/ejemplo");

const conFirebase = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );

export function proxy(request: NextRequest) {
  if (conFirebase()) {
    if (esRutaPrivada(request.nextUrl.pathname) && !request.cookies.get("sesion")) {
      return NextResponse.redirect(new URL("/entrar", request.url));
    }
    return NextResponse.next();
  }
  const respuesta = NextResponse.next();
  if (!request.cookies.get("uid")) {
    respuesta.cookies.set("uid", crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return respuesta;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
