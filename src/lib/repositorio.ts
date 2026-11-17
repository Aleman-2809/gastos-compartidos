import { randomInt, randomUUID } from "node:crypto";
import type { Gasto, Pago } from "@/services/gastos";
import { hayFirebase } from "./firebase-admin";

export type GastoRegistrado = Gasto & { id: string; descripcion: string; creadoEn: string };
export type PagoRegistrado = Pago & { id: string; creadoEn: string };
export type Rol = "admin" | "miembro";
export type Grupo = {
  id: string;
  nombre: string;
  codigo: string;
  miembros: Record<string, string>;
  roles?: Record<string, Rol>;
  gastos: GastoRegistrado[];
  pagos: PagoRegistrado[];
};
export type NuevoGasto = Omit<GastoRegistrado, "id" | "creadoEn">;

export interface Repositorio {
  crearGrupo(uid: string, tuNombre: string, nombre: string): Promise<Grupo>;
  listarGrupos(uid: string): Promise<Grupo[]>;
  obtenerGrupo(id: string, uid: string): Promise<Grupo | null>;
  unirse(codigo: string, uid: string, tuNombre: string): Promise<Grupo | null>;
  agregarGasto(id: string, uid: string, gasto: NuevoGasto): Promise<GastoRegistrado | null>;
  agregarPago(id: string, uid: string, pago: Pago): Promise<PagoRegistrado | null>;
}

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generarCodigo(): string {
  return Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

const memoria = globalThis as unknown as { __grupos?: Map<string, Grupo> };
const grupos = () => (memoria.__grupos ??= new Map<string, Grupo>());
export function reiniciarMemoria() {
  grupos().clear();
}

export const repositorioMemoria: Repositorio = {
  async crearGrupo(uid, tuNombre, nombre) {
    const grupo: Grupo = {
      id: randomUUID(),
      nombre,
      codigo: generarCodigo(),
      miembros: { [uid]: tuNombre },
      roles: { [uid]: "admin" },
      gastos: [],
      pagos: [],
    };
    grupos().set(grupo.id, grupo);
    return structuredClone(grupo);
  },
  async listarGrupos(uid) {
    return [...grupos().values()].filter((g) => uid in g.miembros).map((g) => structuredClone(g));
  },
  async obtenerGrupo(id, uid) {
    const g = grupos().get(id);
    return g && uid in g.miembros ? structuredClone(g) : null;
  },
  async unirse(codigo, uid, tuNombre) {
    const g = [...grupos().values()].find((x) => x.codigo === codigo);
    if (!g) return null;
    g.miembros[uid] ??= tuNombre;
    g.roles = { ...g.roles, [uid]: g.roles?.[uid] ?? "miembro" };
    return structuredClone(g);
  },
  async agregarGasto(id, uid, gasto) {
    const g = grupos().get(id);
    if (!g || !(uid in g.miembros)) return null;
    const registrado = { ...gasto, id: randomUUID(), creadoEn: new Date().toISOString() };
    g.gastos.push(registrado);
    return structuredClone(registrado);
  },
  async agregarPago(id, uid, pago) {
    const g = grupos().get(id);
    if (!g || !(uid in g.miembros)) return null;
    const registrado = { ...pago, id: randomUUID(), creadoEn: new Date().toISOString() };
    g.pagos.push(registrado);
    return structuredClone(registrado);
  },
};

export async function getRepo(): Promise<Repositorio> {
  if (hayFirebase()) return (await import("./repositorio-firestore")).repositorioFirestore;
  return repositorioMemoria;
}
