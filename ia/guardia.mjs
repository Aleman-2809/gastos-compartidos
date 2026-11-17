#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

const SECRETOS = [
  /(^|\/)\.env($|\.(?!example$).+)/,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)/i,
  /credentials[^/]*\.json$/i,
  /service-?account[^/]*\.json$/i,
  /firebase-adminsdk[^/]*\.json$/i,
  /(^|\/)secrets?\//i,
  /(^|\/)\.npmrc$/i,
];

const EFECTO_EXTERNO =
  /(^|[\s;&|(])(git\s+push|curl|wget|ssh|scp|rsync|npm\s+publish|npx\s+vercel|vercel|npx\s+firebase|firebase\s+deploy)(\s|$)/;

const CAMPOS_RUTA = ["file_path", "path", "notebook_path", "pattern", "glob"];

const esSecreto = (ruta) => SECRETOS.some((r) => r.test(ruta.replaceAll("\\", "/")));

function fueraDelProyecto(ruta, cwd) {
  const absoluta = path.resolve(cwd, ruta.replace(/^~(?=\/|$)/, "/home/usuario"));
  const relativa = path.relative(cwd, absoluta);
  return relativa.startsWith("..") || path.isAbsolute(relativa);
}

function rutasDe(herramienta, entrada) {
  if (herramienta === "Bash") {
    const comando = String(entrada.command ?? "");
    return comando
      .split(/[\s;&|<>()"'`]+/)
      .filter((t) => t && !t.startsWith("-"))
      .filter((t) => /[/\\~]|^\.env|\.(pem|key|json)$/i.test(t) || /\$HOME|\$\{HOME\}/.test(t));
  }
  return CAMPOS_RUTA.map((c) => entrada[c]).filter((v) => typeof v === "string" && v);
}

export function evaluar({ tool_name: herramienta, tool_input: entrada = {} }, cwd = process.cwd()) {
  const rutas = rutasDe(herramienta, entrada);
  for (const ruta of rutas) {
    if (esSecreto(ruta)) {
      return {
        decision: "bloquear",
        motivo: `«${ruta}» parece un secreto (.env, clave o credencial).`,
      };
    }
    if (/\$HOME|\$\{HOME\}/.test(ruta) || fueraDelProyecto(ruta, cwd)) {
      if (!/^[a-z]+:\/\//i.test(ruta) && !/^\*+/.test(ruta)) {
        return { decision: "bloquear", motivo: `«${ruta}» está fuera de la carpeta del proyecto.` };
      }
    }
  }
  if (herramienta === "Bash" && EFECTO_EXTERNO.test(String(entrada.command ?? ""))) {
    return { decision: "preguntar", motivo: "Esta acción tiene efecto fuera de la máquina." };
  }
  return { decision: "permitir", motivo: "" };
}

async function main() {
  let texto = "";
  for await (const trozo of process.stdin) texto += trozo;
  const evento = JSON.parse(texto || "{}");
  const cwd = process.env.CLAUDE_PROJECT_DIR || evento.cwd || process.cwd();
  const { decision, motivo } = evaluar(evento, cwd);
  if (decision === "bloquear") {
    console.error(`Bloqueado por ia/guardia.mjs: ${motivo}`);
    process.exit(2);
  }
  if (decision === "preguntar") {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: motivo,
        },
      }),
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`ia/guardia.mjs falló: ${e.message}`);
    process.exit(2);
  });
}
