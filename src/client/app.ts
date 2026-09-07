import type * as ReactNS from "react";
import { createMyPluginsTab } from "./component";
import { en, zh } from "./locales";
import { CSS } from "./styles";

export const NS = "settings.myPlugins";
export const INJECT = ["slots", "locale"] as const;

/**
 * Assemble the client plugin surface: the tab component, the locale
 * dictionary and the slots registration. Mounted exactly like the official
 * plugin inventory (ctx.slots.inject("settings.plugins.tab", …)); order 20
 * keeps this tab last, after 可配置 (0) and 插件列表 (10).
 */
export function createApp(React: typeof ReactNS) {
  const Tab = createMyPluginsTab(React);

  function apply(ctx: any): void {
    ctx.effect(
      () => ctx.locale.register(NS, { zh, en }),
      "my-plugins: dictionaries",
    );

    // Idempotent style injection (survives hot reloads without duplicates).
    if (typeof document !== "undefined" && !document.getElementById("mp-style")) {
      const style = document.createElement("style");
      style.id = "mp-style";
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    const t = ctx.locale.bind(NS);
    const injected = () => ({ t });

    ctx.slots.inject("settings.plugins.tab", () =>
      ctx.slots.register(
        {
          name: "settings.plugins.tab",
          id: "my-plugins",
          order: 20,
          label: () => t("tab"),
          locale: NS,
          inject: injected,
        },
        Tab,
      ),
    );
  }

  return { NS, apply, inject: INJECT };
}