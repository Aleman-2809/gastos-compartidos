import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const authConfigurado = vi.fn(() => true);
const signIn = vi.fn();
const crearCuenta = vi.fn();
vi.mock("@/lib/firebase-cliente", () => ({
  authConfigurado: () => authConfigurado(),
  authCliente: () => ({}),
}));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...a: unknown[]) => signIn(...a),
  createUserWithEmailAndPassword: (...a: unknown[]) => crearCuenta(...a),
}));

import BotonSalir from "./BotonSalir";
import FormEntrar from "./FormEntrar";
import FormGrupo from "./FormGrupo";
import PagosSugeridos from "./PagosSugeridos";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  authConfigurado.mockReturnValue(true);
});

describe("FormGrupo", () => {
  it("crea el grupo y navega a su página", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "g9" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<FormGrupo />);
    await userEvent.type(screen.getByLabelText("Nombre del grupo"), "Paseo");
    await userEvent.type(screen.getByLabelText("Tu nombre en el grupo"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Crear grupo" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/grupos/g9"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      nombre: "Paseo",
      tuNombre: "Ana",
    });
  });

  it("muestra el error de la API y permite reintentar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Escribe un nombre" }) }),
    );
    render(<FormGrupo />);
    await userEvent.type(screen.getByLabelText("Nombre del grupo"), "X");
    await userEvent.type(screen.getByLabelText("Tu nombre en el grupo"), "Y");
    await userEvent.click(screen.getByRole("button", { name: "Crear grupo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escribe un nombre");
    expect(screen.getByRole("button", { name: "Crear grupo" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("muestra un error legible si no hay conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red")));
    render(<FormGrupo />);
    await userEvent.type(screen.getByLabelText("Nombre del grupo"), "X");
    await userEvent.type(screen.getByLabelText("Tu nombre en el grupo"), "Y");
    await userEvent.click(screen.getByRole("button", { name: "Crear grupo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión");
  });
});

describe("PagosSugeridos", () => {
  const miembros = { ana: "Ana", beto: "Beto" };
  const pagos = [{ deUid: "beto", aUid: "ana", montoCentavos: 2000000 }];

  it("indica cuando no hay deudas pendientes", () => {
    render(<PagosSugeridos grupoId="g1" pagos={[]} miembros={miembros} />);
    expect(screen.getByText("No hay deudas pendientes.")).toBeInTheDocument();
  });

  it("confirma en el diálogo, envía el pago y lo quita de la lista al instante", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<PagosSugeridos grupoId="g1" pagos={pagos} miembros={miembros} />);
    expect(screen.getByText(/Beto le paga/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
    await userEvent.click(screen.getByText("Sí, registrar"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/grupos/g1/pagos", expect.anything()),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(pagos[0]);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("muestra el error si la API rechaza el pago", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Sin permiso" }) }),
    );
    render(<PagosSugeridos grupoId="g1" pagos={pagos} miembros={miembros} />);
    await userEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
    await userEvent.click(screen.getByText("Sí, registrar"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso");
  });

  it("cancelar no envía nada", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PagosSugeridos grupoId="g1" pagos={pagos} miembros={miembros} />);
    await userEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
    await userEvent.click(screen.getByText("Cancelar"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("FormEntrar", () => {
  it("explica el modo demostración si Firebase no está configurado", () => {
    authConfigurado.mockReturnValue(false);
    render(<FormEntrar />);
    expect(screen.getByRole("status")).toHaveTextContent("modo demostración");
  });

  it("inicia sesión, crea la cookie en el servidor y navega", async () => {
    signIn.mockResolvedValue({ user: { getIdToken: async () => "TOKEN-DE-PRUEBA-LARGO-1234" } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<FormEntrar />);
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreta1");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/grupos"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      idToken: "TOKEN-DE-PRUEBA-LARGO-1234",
    });
  });

  it("traduce los errores de Firebase", async () => {
    signIn.mockRejectedValue({ code: "auth/invalid-credential" });
    render(<FormEntrar />);
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "equivocada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos");
  });

  it("permite cambiar a crear cuenta", async () => {
    crearCuenta.mockRejectedValue({ code: "auth/email-already-in-use" });
    render(<FormEntrar />);
    await userEvent.click(screen.getByRole("button", { name: "No tengo cuenta" }));
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreta1");
    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ese correo ya tiene una cuenta");
  });
});

describe("BotonSalir", () => {
  it("no se muestra sin Firebase", () => {
    authConfigurado.mockReturnValue(false);
    const { container } = render(<BotonSalir />);
    expect(container).toBeEmptyDOMElement();
  });

  it("cierra la sesión en el servidor y vuelve a /entrar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<BotonSalir />);
    await userEvent.click(screen.getByRole("button", { name: "Salir" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/entrar"));
    expect(fetchMock).toHaveBeenCalledWith("/api/sesion", { method: "DELETE" });
  });
});
