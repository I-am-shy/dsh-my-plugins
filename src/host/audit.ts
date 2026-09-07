import { appendFileSync, mkdirSync } from "node:fs";
import { AUDIT_FILE, DATA_DIR } from "./constants";

/**
 * Append one JSON line to the audit log. Audit failures must never break the
 * operations they trail — the panel treats the log as best-effort.
 */
export function audit(action: string, extra: Record<string, unknown> = {}): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(
      AUDIT_FILE,
      JSON.stringify({ ts: new Date().toISOString(), action, ...extra }) + "\n",
    );
  } catch {
    /* best effort */
  }
}