import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { appAdmin } from "./firebase-admin";
import { generarCodigo, type Grupo, type Repositorio } from "./repositorio";

function db() {
  return getFirestore(appAdmin());
}
const coleccion = () => db().collection("grupos");

type Documento = Omit<Grupo, "id"> & { miembrosUids: string[] };
const aGrupo = (id: string, d: Documento): Grupo => {
  const { miembrosUids: _omitido, ...resto } = d;
  void _omitido;
  return { id, ...resto };
};

export const repositorioFirestore: Repositorio = {
  async crearGrupo(uid, tuNombre, nombre) {
    const ref = coleccion().doc();
    const doc: Documento = {
      nombre,
      codigo: generarCodigo(),
      miembros: { [uid]: tuNombre },
      roles: { [uid]: "admin" },
      miembrosUids: [uid],
      gastos: [],
      pagos: [],
    };
    await ref.set(doc);
    return aGrupo(ref.id, doc);
  },
  async listarGrupos(uid) {
    const consulta = await coleccion().where("miembrosUids", "array-contains", uid).get();
    return consulta.docs.map((d) => aGrupo(d.id, d.data() as Documento));
  },
  async obtenerGrupo(id, uid) {
    const snap = await coleccion().doc(id).get();
    const data = snap.data() as Documento | undefined;
    return data && data.miembrosUids.includes(uid) ? aGrupo(id, data) : null;
  },
  async unirse(codigo, uid, tuNombre) {
    const consulta = await coleccion().where("codigo", "==", codigo).limit(1).get();
    const snap = consulta.docs[0];
    if (!snap) return null;
    const actual = snap.data() as Documento;
    await snap.ref.update({
      [`miembros.${uid}`]: actual.miembros[uid] ?? tuNombre,
      [`roles.${uid}`]: actual.roles?.[uid] ?? "miembro",
      miembrosUids: FieldValue.arrayUnion(uid),
    });
    return aGrupo(snap.id, (await snap.ref.get()).data() as Documento);
  },
  async agregarGasto(id, uid, gasto) {
    if (!(await this.obtenerGrupo(id, uid))) return null;
    const registrado = { ...gasto, id: randomUUID(), creadoEn: new Date().toISOString() };
    await coleccion()
      .doc(id)
      .update({ gastos: FieldValue.arrayUnion(registrado) });
    return registrado;
  },
  async agregarPago(id, uid, pago) {
    if (!(await this.obtenerGrupo(id, uid))) return null;
    const registrado = { ...pago, id: randomUUID(), creadoEn: new Date().toISOString() };
    await coleccion()
      .doc(id)
      .update({ pagos: FieldValue.arrayUnion(registrado) });
    return registrado;
  },
};
