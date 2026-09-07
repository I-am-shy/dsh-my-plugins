import { PROFILE } from "./constants";
import { audit } from "./audit";
import { buildList } from "./loader";
import { setEnabled, uninstallPackage } from "./operations";
import { spawnRestart } from "./restart";
import type { HostContext, HostRequest, HostResponse, MyPluginsState } from "./types";

function send(res: HostResponse, code: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function readBody(req: HostRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid json body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Register the same-origin /my-plugins API on the host webserver.
 *
 * Security posture matches the platform: dsh web binds the loopback by
 * default, so only loopback clients with a same-origin Origin are served.
 * Returns the registration disposer.
 */
export function registerRoutes(ctx: HostContext, state: MyPluginsState): () => void {
  const { loader, webServer } = ctx;
  const port = webServer.port;

  function trusted(req: HostRequest): boolean {
    const remote = String(req.socket?.remoteAddress ?? "");
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote)) return false;
    const origin = req.headers?.origin;
    if (typeof origin === "string" && origin !== "") {
      try {
        const url = new URL(origin);
        if (!["127.0.0.1", "localhost"].includes(url.hostname)) return false;
        if (Number(url.port) !== port) return false;
      } catch {
        return false;
      }
    }
    return true;
  }

  const list = () => ({
    ...buildList(loader, state),
    profile: PROFILE,
    dshPort: port,
  });

  async function handle(req: HostRequest, res: HostResponse): Promise<void> {
    const sub = String(req.url ?? "").split("?")[0].slice("/my-plugins".length) || "/list";
    try {
      if (!trusted(req)) {
        audit("denied", { sub });
        return send(res, 403, { ok: false, message: "forbidden: loopback only" });
      }

      if (sub === "/list" && req.method === "GET") {
        return send(res, 200, { ok: true, ...list() });
      }

      if (sub === "/set-enabled" && req.method === "POST") {
        const body = await readBody(req);
        if (typeof body.pkg !== "string" || typeof body.enabled !== "boolean") {
          return send(res, 400, { ok: false, message: "pkg(string) and enabled(boolean) required" });
        }
        return send(res, 200, { ok: true, ...setEnabled(loader, state, body.pkg, body.enabled) });
      }

      if (sub === "/uninstall" && req.method === "POST") {
        const body = await readBody(req);
        if (typeof body.pkg !== "string") {
          return send(res, 400, { ok: false, message: "pkg(string) required" });
        }
        return send(res, 200, { ok: true, ...uninstallPackage(loader, state, body.pkg) });
      }

      if (sub === "/restart" && req.method === "POST") {
        return send(res, 200, { ok: true, ...spawnRestart(port, process.argv, process.cwd()) });
      }

      send(res, 404, { ok: false, message: "unknown endpoint" });
    } catch (error) {
      audit("error", { sub, error: String((error as { message?: string })?.message ?? error) });
      send(res, 500, { ok: false, message: (error as { message?: string })?.message ?? String(error) });
    }
  }

  return webServer.register({ kind: "prefix", path: "/my-plugins", handler: handle });
}