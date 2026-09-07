import { FIBER_PHASE } from "./constants";
import { patchRowId } from "./patch";
import { installedVersion, userDeps } from "./profile";
import type { LoaderLike, MyPluginsState, PluginRow } from "./types";

/**
 * Find the RUNTIME entry id (raw, group prefix included) for a package.
 *
 * The official inventory passes the raw entry.id straight to loader.update —
 * the loader resolves `a:b` nested ids itself. Group entries (options.group)
 * are always skipped: they must never become an operation target (an earlier
 * buglet disabled the whole `include` group that way).
 */
export function findEntryId(loader: LoaderLike, pkg: string): string | null {
  for (const entry of loader.entries()) {
    if (entry.options?.group) continue;
    if (entry.options?.name === pkg) return entry.id;
  }
  return null;
}

/**
 * Build the panel list: profile dependencies ∩ loader entries (groups and
 * entries outside the user's dependency set are never managed).
 */
export function buildList(
  loader: LoaderLike,
  state: MyPluginsState,
): { plugins: PluginRow[] } {
  const deps = new Set(userDeps());
  const seen = new Set<string>();
  const plugins: PluginRow[] = [];

  for (const entry of loader.entries()) {
    if (entry.options?.group) continue;
    const moduleName = entry.options?.name ?? "";
    if (!deps.has(moduleName)) continue;
    if (seen.has(moduleName)) continue;
    seen.add(moduleName);

    const rawId = String(entry.id);
    const fiberPhase =
      entry.fiber === undefined
        ? null
        : (FIBER_PHASE[entry.fiber.state ?? -1] ?? null);

    plugins.push({
      pkg: moduleName,
      rawId,
      entryId: patchRowId(rawId),
      enabled: !entry.disabled,
      fiberPhase,
      version: installedVersion(moduleName),
      patchDisabled: !!state.disabled[rawId] || !!state.disabled[patchRowId(rawId)],
    });
  }

  return { plugins };
}