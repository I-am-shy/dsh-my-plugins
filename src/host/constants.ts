import { homedir } from "node:os";
import { join } from "node:path";
import type { FiberPhaseName } from "./types";

export const NAME = "dsh-my-plugins";
export const INJECT = ["loader", "webServer"] as const;

/** $DSH_HOME (default ~/.dsh). */
export const DSHP = process.env.DSH_HOME || join(homedir(), ".dsh");
export const PROFILE = process.env.DSH_PROFILE || "web";
export const PROFILE_DIR = join(DSHP, "profiles", PROFILE);
export const PROFILE_PKG = join(PROFILE_DIR, "package.json");
export const PROFILE_PATCH = join(PROFILE_DIR, "cordis.patch.yml");

/** Panel-owned data directory under $DSH_HOME. */
export const DATA_DIR = join(DSHP, "dsh-my-plugins");
export const STATE_FILE = join(DATA_DIR, "state.json");
export const AUDIT_FILE = join(DATA_DIR, "audit.jsonl");

/** Markers delimiting the managed block inside the profile patch layer. */
export const BLOCK_BEGIN = "# dsh-my-plugins managed begin";
export const BLOCK_END = "# dsh-my-plugins managed end";

/** Numeric fiber states (Cordis' const enum) mapped to display names. */
export const FIBER_PHASE: Record<number, FiberPhaseName | null> = {
  0: "pending",
  1: "loading",
  2: "active",
  3: "failed",
  4: "unloading",
  5: null, // DISPOSED
};