// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluar } from "./guardia.mjs";

const raiz = path.resolve(__dirname, "..");
const ev = (tool_name: string, tool_input: Record<string, string>) =>
  evaluar({ tool_name, tool_input }, raiz) as { decision: string };

describe("la IA no puede leer secretos", () => {
  it.each([
    [".env"],
    [".env.local"],
    [".env.production"],
    ["./.env"],
    [`${raiz}/.env.local`],
    ["claves/firebase-adminsdk-abc.json"],
    ["serviceAccount.json"],
    ["certificado.pem"],
    ["id_rsa"],
    ["secrets/token.txt"],
  ])("bloquea Read de %s", (ruta) => {
    expect(ev("Read", { file_path: ruta }).decision).toBe("bloquear");
  });

  it("bloquea Grep/Glob/Edit/Write sobre secretos", () => {
    expect(ev("Grep", { path: ".env.local", pattern: "KEY" }).decision).toBe("bloquear");
    expect(ev("Edit", { file_path: ".env" }).decision).toBe("bloquear");
    expect(ev("Write", { file_path: ".env.local" }).decision).toBe("bloquear");
  });

  it.each(["cat .env", "cat .env.local", "type .env.production", "grep KEY ./.env.local"])(
    "bloquea el comando de shell «%s»",
    (comando) => {
      expect(ev("Bash", { command: comando }).decision).toBe("bloquear");
    },
  );

  it("permite .env.example, que no contiene secretos", () => {
    expect(ev("Read", { file_path: ".env.example" }).decision).toBe("permitir");
  });
});

describe("la IA no sale de la carpeta del proyecto", () => {
  it.each(["/etc/passwd", "../otro-proyecto/app.ts", "~/.ssh/config", "/home/usuario/.bashrc"])(
    "bloquea Read de %s",
    (ruta) => {
      expect(ev("Read", { file_path: ruta }).decision).toBe("bloquear");
    },
  );

  it.each(["cat /etc/passwd", "ls ../", "cat ~/.ssh/id_ed25519", "cat $HOME/.bashrc"])(
    "bloquea el comando «%s»",
    (comando) => {
      expect(ev("Bash", { command: comando }).decision).toBe("bloquear");
    },
  );

  it("permite rutas dentro del proyecto", () => {
    expect(ev("Read", { file_path: "src/services/gastos.ts" }).decision).toBe("permitir");
    expect(ev("Read", { file_path: `${raiz}/package.json` }).decision).toBe("permitir");
    expect(ev("Bash", { command: "npm run check" }).decision).toBe("permitir");
  });
});

describe("las acciones con efecto externo piden permiso", () => {
  it.each([
    "git push origin main",
    "curl https://ejemplo.com",
    "wget https://ejemplo.com/a.sh",
    "npm publish",
    "npx vercel --prod",
    "npx firebase deploy",
    "ssh usuario@servidor",
  ])("«%s» pide confirmación", (comando) => {
    expect(ev("Bash", { command: comando }).decision).toBe("preguntar");
  });
});

describe("el hook funciona como proceso real (exit code 2 = bloqueado)", () => {
  const ejecutar = (evento: object) =>
    spawnSync("node", ["ia/guardia.mjs"], {
      cwd: raiz,
      input: JSON.stringify(evento),
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: raiz },
    });

  it("termina con código 2 y explica el motivo al leer .env", () => {
    const r = ejecutar({ tool_name: "Read", tool_input: { file_path: ".env" } });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("secreto");
  });

  it("termina con código 2 al salir de la carpeta", () => {
    const r = ejecutar({ tool_name: "Read", tool_input: { file_path: "/etc/passwd" } });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("fuera de la carpeta");
  });

  it("devuelve la decisión «ask» para git push", () => {
    const r = ejecutar({ tool_name: "Bash", tool_input: { command: "git push" } });
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision).toBe("ask");
  });

  it("termina con 0 sin salida para una acción permitida", () => {
    const r = ejecutar({ tool_name: "Read", tool_input: { file_path: "package.json" } });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("ante una entrada ilegible bloquea (fallo seguro)", () => {
    const r = spawnSync("node", ["ia/guardia.mjs"], {
      cwd: raiz,
      input: "{no es json",
      encoding: "utf8",
    });
    expect(r.status).toBe(2);
  });
});

describe("la configuración declarada coincide con lo que se prueba", () => {
  const ajustes = JSON.parse(readFileSync(path.join(raiz, ".claude/settings.json"), "utf8"));
  const negadas: string[] = ajustes.permissions.deny;
  const preguntar: string[] = ajustes.permissions.ask;

  it("niega la lectura de .env* y de claves", () => {
    for (const regla of [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(**/*.pem)",
      "Read(**/*firebase-adminsdk*.json)",
    ]) {
      expect(negadas).toContain(regla);
    }
  });

  it("niega salir de la carpeta del proyecto", () => {
    for (const regla of ["Read(~/**)", "Read(../**)", "Write(../**)"])
      expect(negadas).toContain(regla);
  });

  it("pide permiso para git push, curl y despliegues", () => {
    for (const regla of [
      "Bash(git push:*)",
      "Bash(curl:*)",
      "Bash(npx vercel:*)",
      "Bash(npx firebase:*)",
    ]) {
      expect(preguntar).toContain(regla);
    }
  });

  it("tiene el sandbox activado y sin escapes", () => {
    expect(ajustes.sandbox.enabled).toBe(true);
    expect(ajustes.sandbox.allowUnsandboxedCommands).toBe(false);
  });

  it("registra el guardia como hook PreToolUse", () => {
    const hooks = JSON.stringify(ajustes.hooks.PreToolUse);
    expect(hooks).toContain("ia/guardia.mjs");
  });

  it(".gitignore ignora .env* pero deja subir .env.example", () => {
    const ignore = readFileSync(path.join(raiz, ".gitignore"), "utf8").split("\n");
    expect(ignore).toContain(".env*");
    expect(ignore).toContain("!.env.example");
  });
});
