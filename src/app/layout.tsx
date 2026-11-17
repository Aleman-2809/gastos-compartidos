import type { Metadata } from "next";
import Link from "next/link";
import BotonSalir from "@/components/BotonSalir";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gastos compartidos entre amigos",
  description:
    "Registra gastos en grupo y descubre quién le debe a quién con el menor número de pagos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <header>
          <p className="marca">Gastos compartidos</p>
          <nav aria-label="Principal">
            <ul>
              <li>
                <Link href="/">Inicio</Link>
              </li>
              <li>
                <Link href="/grupos">Mis grupos</Link>
              </li>
              <li>
                <Link href="/grupos/nuevo">Nuevo grupo</Link>
              </li>
              <li>
                <Link href="/unirse">Unirme</Link>
              </li>
              <li>
                <Link href="/grupos/ejemplo">Ejemplo</Link>
              </li>
              <li>
                <Link href="/entrar">Entrar</Link>
              </li>
              <li>
                <BotonSalir />
              </li>
            </ul>
          </nav>
        </header>
        <main id="contenido">{children}</main>
        <footer>
          <p>Proyecto 36 · Gastos compartidos entre amigos</p>
        </footer>
      </body>
    </html>
  );
}
