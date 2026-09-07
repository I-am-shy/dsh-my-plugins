/**
 * dsh-my-plugins — host side.
 *
 * Adds a same-origin HTTP API to the running dsh web and operates the Cordis
 * Loader directly so the 「我的插件」 tab can manage only the plugins the user
 * installed:
 *
 *   - list        profile dependencies ∩ loader entries (native plugins untouched)
 *   - set-enabled loader.update(id, {disabled}) hot + persistence into the
 *                 profile's cordis.patch.yml (survives restarts)
 *   - uninstall   dsh plugin remove + bundle cleanup + loader.remove
 *   - restart     detached helper that respawns dsh web once the port is free
 *
 * Persistence format (managed block inside <profile>/cordis.patch.yml):
 *
 *   # dsh-my-plugins managed begin
 *   - id: <entryId>
 *     disabled: true
 *   # dsh-my-plugins managed end
 *
 * Safety: only packages in the profile dependency list can be managed; HTTP
 * accepts loopback + same-origin requests only; every operation is appended to
 * $DSH_HOME/dsh-my-plugins/audit.jsonl.
 */
import { INJECT, NAME } from "./constants";
import { loadState, renderPatchLayer, saveState } from "./patch";
import { registerRoutes } from "./routes";
import type { HostContext } from "./types";

export const name = NAME;
export const inject = INJECT;

export function apply(ctx: unknown): unknown {
  const host = ctx as HostContext;
  if (!host || typeof host !== "object") {
    throw new Error(`${NAME}: invalid context`);
  }
  if (!host.loader) throw new Error(`${NAME}: loader service unavailable`);
  if (!host.webServer) throw new Error(`${NAME}: webServer service unavailable`);

  const state = loadState();

  // Self-heal: drop disabled keys pointing at group entries or entries that
  // no longer exist (prevents a stray historical key — e.g. one targeting the
  // whole `include` group tree — from being rendered into the patch layer at
  // the next boot).
  const alive = new Set<string>();
  for (const entry of host.loader.entries()) {
    if (entry.options?.group) continue;
    alive.add(String(entry.id));
  }
  let changed = false;
  for (const key of Object.keys(state.disabled)) {
    if (state.disabled[key] && !alive.has(key)) {
      delete state.disabled[key];
      changed = true;
    }
  }
  if (changed) {
    saveState(state);
    renderPatchLayer(state);
  }

  return registerRoutes(host, state);
}