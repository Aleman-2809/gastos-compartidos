"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Algo salió mal</h1>
      <p role="alert">No pudimos cargar esta página. Inténtalo de nuevo.</p>
      <button type="button" onClick={reset}>
        Reintentar
      </button>
    </>
  );
}
