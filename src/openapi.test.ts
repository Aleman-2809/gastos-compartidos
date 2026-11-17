// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(__dirname, "..");
const yaml = readFileSync(path.join(raiz, "openapi.yaml"), "utf8");
const rutas = (function buscar(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const r = path.join(dir, n);
    return statSync(r).isDirectory() ? buscar(r) : n === "route.ts" ? [r] : [];
  });
})(path.join(raiz, "src/app/api"));

describe("openapi.yaml está al día con la API", () => {
  it.each(rutas.map((r) => [r]))("documenta %s y sus métodos", (archivo) => {
    const url = path
      .relative(path.join(raiz, "src/app"), path.dirname(archivo))
      .split(path.sep)
      .map((s) => s.replace(/^\[(.+)\]$/, "{$1}"))
      .join("/");
    expect(yaml).toContain(`  /${url}:`);
    const bloque = yaml.split(`  /${url}:`)[1].split(/\n {2}\/api\//)[0];
    for (const m of readFileSync(archivo, "utf8").matchAll(
      /export async function (GET|POST|PUT|PATCH|DELETE)/g,
    )) {
      expect(bloque, `${url} ${m[1]}`).toContain(`    ${m[1].toLowerCase()}:`);
    }
  });
});
