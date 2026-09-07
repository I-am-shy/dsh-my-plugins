/**
 * dsh-my-plugins — client entry.
 *
 * The DSH client module system executes this bundle as a classic CJS factory:
 * the loader supplies `require`, and the factory must return the module
 * exports (`{apply, inject, NS}`). React is a baseline external shared with
 * the platform, resolved at runtime through that `require` — this is why the
 * source never imports "react" statically; the bundler leaves the call in
 * place and inlines only the local modules.
 */
import { createApp } from "./app";

declare global {
  interface Window {
    __ModuleLoader__?: {
      load(spec: {
        id: string;
        factory: (require: (id: string) => unknown) => unknown;
      }): void;
    };
  }
}

function factory(require: (id: string) => unknown) {
  const React = require("react") as typeof import("react");
  return createApp(React);
}

if (typeof window !== "undefined" && window.__ModuleLoader__) {
  window.__ModuleLoader__.load({ id: "dsh-my-plugins", factory });
}