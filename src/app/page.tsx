import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Gastos compartidos entre amigos</h1>
      <p>
        Registra los gastos en común de tu grupo y la aplicación calcula quién le debe a quién con
        el menor número de pagos.
      </p>
      <p>
        <Link href="/grupos/nuevo">Crear un grupo</Link> ·{" "}
        <Link href="/unirse">Unirme con un código</Link> ·{" "}
        <Link href="/grupos/ejemplo">Ver un grupo de ejemplo</Link>
      </p>
    </>
  );
}
