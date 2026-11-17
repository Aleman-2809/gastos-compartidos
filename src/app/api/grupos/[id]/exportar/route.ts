import { getRepo } from "@/lib/repositorio";
import { grupoACsv } from "@/lib/exportar";
import { noEncontrado, sinSesion, uidActual } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await uidActual();
  if (!uid) return sinSesion();
  const { id } = await params;
  const grupo = await (await getRepo()).obtenerGrupo(id, uid);
  if (!grupo) return noEncontrado("Grupo no encontrado");
  return new Response("\uFEFF" + grupoACsv(grupo), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="gastos-${grupo.codigo}.csv"`,
    },
  });
}
