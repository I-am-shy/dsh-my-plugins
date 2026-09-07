/**
 * Shared host-side types.
 *
 * These are the minimal structural interfaces this plugin needs from the
 * services it injects ("loader", "webServer"). They are deliberately loose —
 * the real implementations come from @deepseek-ai/cordis and
 * @deepseek-ai/dsh-host-webserver at runtime and are not imported here.
 */

/** Root-level fiber phases (mirrors Cordis' FiberState const enum). */
export type FiberPhaseName = "pending" | "loading" | "active" | "failed" | "unloading";

/** The subset of a Loader tree entry this plugin reads. */
export interface PluginEntryLike {
  id: string;
  options?: {
    name?: string;
    group?: boolean;
    [key: string]: unknown;
  };
  disabled?: boolean;
  fiber?: {
    state?: number;
  };
}

/** The subset of the Cordis Loader this plugin uses. */
export interface LoaderLike {
  entries(): Iterable<PluginEntryLike>;
  update(id: string, options: { disabled?: boolean }): unknown;
  remove(id: string): unknown;
}

export type HostRequest = {
  url?: string;
  method?: string;
  headers?: { [key: string]: unknown };
  socket?: { remoteAddress?: string };
  on(event: string, listener: (...args: any[]) => void): unknown;
  destroy(): unknown;
};

export type HostResponse = {
  writeHead(code: number, headers?: { [key: string]: unknown }): unknown;
  end(body?: unknown): unknown;
};

/** The subset of the DSH host webserver this plugin registers routes on. */
export interface WebServerLike {
  port?: number;
  register(spec: {
    kind: "exact" | "prefix";
    path: string;
    handler: (req: HostRequest, res: HostResponse) => unknown;
  }): () => void;
}

/** The context passed to apply() at activation time. */
export interface HostContext {
  loader: LoaderLike;
  webServer: WebServerLike;
}

/** Persisted state ({disabled: runtimeEntryId -> true}). */
export interface MyPluginsState {
  disabled: Record<string, boolean>;
}

/** One row of the /my-plugins/list payload. */
export interface PluginRow {
  pkg: string;
  rawId: string;
  entryId: string;
  enabled: boolean;
  fiberPhase: FiberPhaseName | null;
  version: string;
  patchDisabled: boolean;
}