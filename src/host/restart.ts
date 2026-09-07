import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { audit } from "./audit";
import { DATA_DIR } from "./constants";

export interface RestartResult {
  restarted: boolean;
  logOut: string;
}

/**
 * Rebuild the relaunch argv for the dsh web respawn.
 *
 * `--no-open` is injected so that continuing an existing session never pops a
 * fresh default-browser tab; every other argument is preserved verbatim.
 */
export function relaunchArgs(argv: string[]): string[] {
  const appArgs = [...argv.slice(2)];
  const webIndex = appArgs.indexOf("web");
  if (webIndex >= 0 && !appArgs.includes("--no-open")) {
    appArgs.splice(webIndex + 1, 0, "--no-open");
  }
  return appArgs;
}

/**
 * Restart the running dsh web from inside the plugin.
 *
 * A detached helper process kills this dsh web instance, waits until the
 * listen port is free, then respawns the same launch command with stdio
 * redirected to a timestamped log under $DSH_HOME/dsh-my-plugins/.
 */
export function spawnRestart(
  port: number | undefined,
  argv: string[],
  cwd: string,
): RestartResult {
  const portArg = port || 3080;
  const logOut = join(DATA_DIR, `restart-${Date.now()}.log`);

  const launch = {
    file: argv[0],
    args: [...process.execArgv, argv[1], ...relaunchArgs(argv)],
    cwd,
  };

  const helper = [
    "const { spawn } = require('node:child_process')",
    "const fs = require('node:fs')",
    "const net = require('node:net')",
    `const launch = ${JSON.stringify(launch)}`,
    `const logOut = ${JSON.stringify(logOut)}`,
    `const port = ${JSON.stringify(portArg)}`,
    `const oldPid = ${JSON.stringify(process.pid)}`,
    'function portFree(p, cb) { const s = net.connect(p, "127.0.0.1"); s.once("connect", () => { s.destroy(); cb(false) }); s.once("error", () => cb(true)) }',
    "function waitPort(p, tries, cb) { portFree(p, (free) => { if (free || tries <= 0) cb(free); else setTimeout(() => waitPort(p, tries - 1, cb), 500) }) }",
    'setTimeout(() => { try { process.kill(oldPid, "SIGTERM") } catch {} setTimeout(() => { try { process.kill(oldPid, "SIGKILL") } catch {} }, 4000) }, 600)',
    "waitPort(port, 40, (free) => {",
    '  if (!free) { console.error("port still busy, giving up"); process.exit(1) }',
    '  const out = fs.openSync(logOut, "a")',
    '  const child = spawn(launch.file, launch.args, { cwd: launch.cwd, detached: true, stdio: ["ignore", out, out] })',
    "  child.unref()",
    "  process.exit(0)",
    "})",
  ].join("\n");

  mkdirSync(DATA_DIR, { recursive: true });
  const child = spawn(process.execPath, ["-e", helper], { detached: true, stdio: "ignore" });
  child.unref();

  audit("restart", { logOut });
  return { restarted: true, logOut };
}