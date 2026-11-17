export const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" });
export const formatear = (centavos: number) => moneda.format(centavos / 100);

export async function enviarJson<T = unknown>(
  url: string,
  cuerpo: unknown,
): Promise<{ ok: true; datos: T } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: datos.error ?? "No se pudo completar la acción" };
    return { ok: true, datos: datos as T };
  } catch {
    return { ok: false, error: "No hay conexión con el servidor" };
  }
}
