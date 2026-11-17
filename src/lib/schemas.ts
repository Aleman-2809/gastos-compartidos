import { z } from "zod";

const nombre = z.string().trim().min(1, "Escribe un nombre").max(60, "Máximo 60 caracteres");

export const crearGrupoSchema = z.object({ nombre, tuNombre: nombre });

export const unirseSchema = z.object({
  codigo: z.string().trim().toUpperCase().length(6, "El código tiene 6 caracteres"),
  tuNombre: nombre,
});

export const crearGastoSchema = z
  .object({
    descripcion: z.string().trim().min(1, "Describe el gasto").max(80),
    montoCentavos: z
      .int("El monto debe ser entero")
      .positive("El monto debe ser mayor que 0")
      .max(100_000_000_000),
    pagadorUid: z.string().min(1),
    participantes: z.array(z.string().min(1)).min(1, "Elige al menos un participante"),
    porcentajes: z.record(z.string(), z.number().min(0).max(100)).optional(),
  })
  .refine(
    (d) =>
      !d.porcentajes ||
      (Object.keys(d.porcentajes).sort().join("|") === [...d.participantes].sort().join("|") &&
        Math.round(Object.values(d.porcentajes).reduce((a, b) => a + b, 0) * 100) === 10000),
    { message: "Los porcentajes deben sumar 100 y corresponder a los participantes" },
  );

export const crearPagoSchema = z
  .object({
    deUid: z.string().min(1),
    aUid: z.string().min(1),
    montoCentavos: z.int().positive().max(100_000_000_000),
  })
  .refine((d) => d.deUid !== d.aUid, { message: "Quien paga y quien recibe deben ser distintos" });

export const sesionSchema = z.object({ idToken: z.string().min(20, "Token inválido") });
