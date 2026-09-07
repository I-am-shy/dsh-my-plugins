import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  BLOCK_BEGIN,
  BLOCK_END,
  DATA_DIR,
  PROFILE_DIR,
  PROFILE_PATCH,
  STATE_FILE,
} from "./constants";
import type { MyPluginsState } from "./types";

/**
 * Runtime entry id → config-row id.
 *
 * Runtime ids inside the include tree carry the group prefix (e.g.
 * `include:dsh-pocket`); the official inventory uses the RAW id for runtime
 * `loader.update` (its pluginEntryId is the identity function) and the loader
 * resolves `a:b` nested ids natively. Patch rows written back to
 * `cordis.patch.yml`, however, must use the plain config-row id: the last
 * `:`-separated segment. This function produces the config-row form only.
 */
export function patchRowId(id: string): string {
  const segments = String(id).split(":");
  return segments[segments.length - 1];
}

/** Load persisted state ({disabled: runtimeEntryId -> true}); first run returns empty. */
export function loadState(): MyPluginsState {
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as MyPluginsState).disabled &&
      typeof (parsed as MyPluginsState).disabled === "object"
    ) {
      return parsed as MyPluginsState;
    }
  } catch {
    /* first run */
  }
  return { disabled: {} };
}

export function saveState(state: MyPluginsState): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
}

/**
 * Render state.disabled back into the profile's `cordis.patch.yml`.
 *
 * That file is a top-level YAML array of loader PatchOptions rows. This plugin
 * owns the whole array body: leading comment lines are preserved, and a
 * pre-existing `[]` empty array is replaced by the managed block (mixing both
 * would produce invalid YAML). With no disabled rows the block contains `[]`,
 * so the file stays parseable in every state.
 */
export function renderPatchLayer(state: MyPluginsState): void {
  const ids = Object.keys(state.disabled)
    .filter((id) => state.disabled[id])
    .sort();

  let existing = "";
  try {
    existing = readFileSync(PROFILE_PATCH, "utf8");
  } catch {
    /* file does not exist yet */
  }

  const head: string[] = [];
  for (const line of existing.split("\n")) {
    if (line.includes(BLOCK_BEGIN)) break;
    if (line.trim().startsWith("#")) head.push(line);
  }

  const rows = ids.map((id) => `- id: ${patchRowId(id)}\n  disabled: true`);
  const block = rows.length
    ? [BLOCK_BEGIN, ...rows, BLOCK_END].join("\n")
    : [BLOCK_BEGIN, "[]", BLOCK_END].join("\n");

  mkdirSync(PROFILE_DIR, { recursive: true });
  writeFileSync(PROFILE_PATCH, [...head, block].join("\n").trimEnd() + "\n");
}