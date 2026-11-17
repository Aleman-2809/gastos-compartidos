import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

import CompartirCodigo from "./CompartirCodigo";
import FormGasto from "./FormGasto";
import FormUnirse from "./FormUnirse";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  push.mockClear();
});

describe("FormUnirse", () => {
  it("muestra el error cuando el código no existe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "No existe un grupo con ese código" }),
      }),
    );
    render(<FormUnirse />);
    await userEvent.type(screen.getByLabelText("Código del grupo"), "ZZZZZZ");
    await userEvent.type(screen.getByLabelText("Tu nombre en el grupo"), "Beto");
    await userEvent.click(screen.getByRole("button", { name: "Unirme" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No existe un grupo con ese código");
    expect(push).not.toHaveBeenCalled();
  });

  it("navega al grupo cuando el código es válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "g1" }) }),
    );
    render(<FormUnirse />);
    await userEvent.type(screen.getByLabelText("Código del grupo"), "ABC234");
    await userEvent.type(screen.getByLabelText("Tu nombre en el grupo"), "Beto");
    await userEvent.click(screen.getByRole("button", { name: "Unirme" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/grupos/g1"));
  });
});

describe("FormGasto", () => {
  const miembros = { ana: "Ana", beto: "Beto" };

  it("avisa si los porcentajes no suman 100 y no envía", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<FormGasto grupoId="g1" miembros={miembros} />);
    await userEvent.type(screen.getByLabelText("Descripción"), "Cena");
    await userEvent.type(screen.getByLabelText("Monto (COP)"), "50000");
    await userEvent.selectOptions(screen.getByLabelText("¿Cómo se reparte?"), "porcentajes");
    await userEvent.type(screen.getByLabelText("Porcentaje de Ana"), "60");
    await userEvent.type(screen.getByLabelText("Porcentaje de Beto"), "30");
    await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("deben sumar 100");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía el monto en centavos y reparte en partes iguales", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<FormGasto grupoId="g1" miembros={miembros} />);
    await userEvent.type(screen.getByLabelText("Descripción"), "Cena");
    await userEvent.type(screen.getByLabelText("Monto (COP)"), "50000.5");
    await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.montoCentavos).toBe(5000050);
    expect(cuerpo.participantes).toEqual(["ana", "beto"]);
    expect(cuerpo.porcentajes).toBeUndefined();
  });
});

describe("CompartirCodigo", () => {
  it("copia el código al portapapeles", async () => {
    const user = userEvent.setup();
    render(<CompartirCodigo codigo="ABC234" nombre="Paseo" />);
    await user.click(screen.getByRole("button", { name: "Copiar código" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Código copiado");
    expect(await navigator.clipboard.readText()).toBe("ABC234");
  });
});
