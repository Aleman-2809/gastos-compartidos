import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>No encontramos lo que buscas</h1>
      <p>El grupo no existe o no eres miembro de él.</p>
      <p>
        <Link href="/grupos">Ir a mis grupos</Link>
      </p>
    </>
  );
}
