import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/firebase-cliente", () => ({ authConfigurado: () => true, authCliente: () => ({}) }));

import CompartirCodigo from "./CompartirCodigo";
import FormEntrar from "./FormEntrar";
import FormGasto from "./FormGasto";
import FormGrupo from "./FormGrupo";
import FormUnirse from "./FormUnirse";
import PagosSugeridos from "./PagosSugeridos";

afterEach(cleanup);

async function violaciones(contenedor: HTMLElement) {
  const r = await axe.run(contenedor, { rules: { "color-contrast": { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.help}`);
}

const miembros = { ana: "Ana", beto: "Beto" };

describe("accesibilidad con axe-core (0 violaciones)", () => {
  it.each([
    ["FormGrupo", () => <FormGrupo />],
    ["FormUnirse", () => <FormUnirse />],
    ["FormEntrar", () => <FormEntrar />],
    ["FormGasto", () => <FormGasto grupoId="g1" miembros={miembros} />],
    ["CompartirCodigo", () => <CompartirCodigo codigo="ABC234" nombre="Paseo" />],
    [
      "PagosSugeridos",
      () => (
        <PagosSugeridos
          grupoId="g1"
          miembros={miembros}
          pagos={[{ deUid: "beto", aUid: "ana", montoCentavos: 5000 }]}
        />
      ),
    ],
  ])("%s", async (_nombre, vista) => {
    const { container } = render(vista());
    expect(await violaciones(container)).toEqual([]);
  });
});
