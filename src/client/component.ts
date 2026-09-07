import type * as ReactNS from "react";
import { api } from "./api";

export type Translator = (key: string) => string;

export interface MyPluginsTabProps {
  t: Translator;
}

/** One row of the /my-plugins/list payload. */
export interface PluginListItem {
  pkg: string;
  rawId: string;
  entryId: string;
  enabled: boolean;
  fiberPhase: string | null;
  version: string;
  patchDisabled: boolean;
  [key: string]: unknown;
}

const PHASE_TEXT: Record<string, string> = {
  pending: "phasePending",
  loading: "phaseLoading",
  active: "phaseActive",
  failed: "phaseFailed",
  unloading: "phaseUnloading",
};

type Notice = { kind: "ok" | "err"; text: string };
type ModalState = { kind: "restart" } | { kind: "uninstall"; pkg: string };

/**
 * Build the panel component. React itself is injected by the DSH client module
 * loader (the factory's `require("react")`), so nothing here imports it
 * statically — this module only uses its TYPE space.
 */
export function createMyPluginsTab(React: typeof ReactNS) {
  const { createElement: h, useState, useEffect, useRef } = React;

  function phaseText(phase: string | null, t: Translator): string {
    return t(phase ? PHASE_TEXT[phase] || "phaseUnobserved" : "phaseUnobserved");
  }

  function MyPluginsTab(props: MyPluginsTabProps): ReactNS.ReactElement {
    const t = props.t;

    const [plugins, setPlugins] = useState<PluginListItem[] | null>(null); // null = loading
    const [error, setError] = useState("");
    const [notice, setNotice] = useState<Notice | null>(null);
    const [busy, setBusy] = useState<Record<string, boolean>>({});
    const [modal, setModal] = useState<ModalState | null>(null);
    const pollTimer = useRef<any>(null);
    const [expanded, setExpanded] = useState<string | null>(null); // official behaviour: one open card at a time
    const [restarted, setRestarted] = useState(false);

    const refresh = () => {
      setError("");
      setPlugins(null);
      api<{ plugins?: PluginListItem[] }>("/list")
        .then((data) => setPlugins(data.plugins ?? []))
        .catch((err: any) => {
          setError(String(err?.message ?? err));
          setPlugins([]);
        });
    };

    useEffect(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-dismiss notices: success after 4s, failure after 8s.
    useEffect(() => {
      if (!notice) return undefined;
      const timer = setTimeout(() => setNotice(null), notice.kind === "err" ? 8000 : 4000);
      return () => clearTimeout(timer);
    }, [notice]);

    // Clear the restart poller when the component unmounts.
    useEffect(
      () => () => {
        if (pollTimer.current) clearInterval(pollTimer.current);
      },
      [],
    );

    const withBusy = (key: string, fn: () => Promise<unknown>) => {
      setBusy((current) => ({ ...current, [key]: true }));
      return Promise.resolve()
        .then(fn)
        .catch((err: any) => {
          setNotice({ kind: "err", text: `${t("opFailed")}：${err?.message ?? err}` });
        })
        .finally(() => {
          setBusy((current) => ({ ...current, [key]: false }));
          setModal(null);
        });
    };

    const toggle = (pkg: string) => {
      const row = (plugins ?? []).find((p) => p.pkg === pkg);
      if (!row) return;
      const enabled = !row.enabled;
      return withBusy(pkg, () =>
        api("/set-enabled", { pkg, enabled }).then(() => {
          setNotice({ kind: "ok", text: t("opDone") });
          refresh();
        }),
      );
    };

    const uninstallRow = (pkg: string) =>
      withBusy(pkg, () =>
        api("/uninstall", { pkg }).then(() => {
          setNotice({ kind: "ok", text: t("removed").replace("{pkg}", pkg) });
          refresh();
        }),
      );

    /**
     * Restart, then poll until the server is back and reload THE CURRENT page
     * (never opens a new one). The early register of this plugin's own route
     * means a single 200 is not proof of a completed boot, so we require three
     * consecutive successes (~4.5s of margin) before reloading.
     */
    const doRestart = () =>
      withBusy("__restart__", () =>
        api("/restart", {}).then(() => {
          setRestarted(true);
          setNotice({ kind: "ok", text: t("restarting") });
          let attempts = 0;
          let okStreak = 0;
          pollTimer.current = setInterval(() => {
            attempts += 1;
            fetch(`/my-plugins/list?_=${Date.now()}`)
              .then((res) => {
                if (res.ok) {
                  okStreak += 1;
                  if (okStreak >= 3) {
                    clearInterval(pollTimer.current);
                    location.reload();
                  }
                } else {
                  okStreak = 0;
                  if (attempts >= 80) {
                    clearInterval(pollTimer.current);
                    setNotice({ kind: "err", text: t("restartTimeout") });
                  }
                }
              })
              .catch(() => {
                okStreak = 0;
                if (attempts >= 80) {
                  clearInterval(pollTimer.current);
                  setNotice({ kind: "err", text: t("restartTimeout") });
                }
              });
          }, 1500);
        }),
      );

    // ---- card (mirrors the official inventory structure) ----
    const card = (row: PluginListItem): ReactNS.ReactElement => {
      const open = expanded === row.pkg;
      const busyKey = busy[row.pkg];
      const tag = row.enabled ? t("enabledTag") : t("disabledTag");

      return h(
        "li",
        { className: "mp-card", "data-open": open ? "true" : undefined, key: row.pkg },
        h(
          "button",
          {
            className: "mp-cardContent",
            type: "button",
            "aria-expanded": open,
            onClick: () => setExpanded((current) => (current === row.pkg ? null : row.pkg)),
          },
          h("strong", { className: "mp-cardTitle", title: row.pkg }, row.pkg),
          h(
            "span",
            { className: "mp-cardTrailing" },
            // like the official list: the status dot renders only when enabled
            row.enabled
              ? h("span", {
                  className: "mp-statusDot",
                  "data-phase": row.fiberPhase || "unobserved",
                  role: "img",
                  title: phaseText(row.fiberPhase, t),
                })
              : null,
            h(
              "span",
              { className: "mp-configTag", "data-enabled": row.enabled ? "true" : "false" },
              tag,
            ),
            h(
              "svg",
              {
                className: "mp-chevron",
                width: 12,
                height: 12,
                viewBox: "0 0 14 14",
                fill: "none",
                "aria-hidden": "true",
              },
              h("path", {
                d: "M3.5 5.5 7 9l3.5-3.5",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              }),
            ),
          ),
        ),
        open
          ? h(
              "div",
              { className: "mp-cardDetails" },
              h("code", { className: "mp-entryValue" }, row.entryId),
              h(
                "dl",
                { className: "mp-details" },
                h("div", null, h("dt", null, t("version")), h("dd", null, row.version)),
                h("div", null, h("dt", null, t("configuration")), h("dd", null, tag)),
                row.enabled
                  ? h("div", null, h("dt", null, t("cordis")), h("dd", null, phaseText(row.fiberPhase, t)))
                  : null,
                row.patchDisabled
                  ? h("div", null, h("dt", null, t("persist")), h("dd", null, t("persistedYes")))
                  : null,
              ),
              h(
                "div",
                { className: "mp-actions" },
                row.pkg === "dsh-my-plugins"
                  ? h("span", { className: "mp-status" }, t("selfDisable"))
                  : h(
                      "button",
                      {
                        className: "mp-btn",
                        type: "button",
                        disabled: !!busyKey || restarted,
                        onClick: () => toggle(row.pkg),
                      },
                      row.enabled ? t("disable") : t("enable"),
                    ),
                h(
                  "button",
                  {
                    className: "mp-btn mp-danger",
                    type: "button",
                    disabled: !!busyKey || restarted,
                    onClick: () => setModal({ kind: "uninstall", pkg: row.pkg }),
                  },
                  t("uninstall"),
                ),
              ),
            )
          : null,
      );
    };

    // ---- body states ----
    let body: ReactNS.ReactElement;
    if (restarted) {
      body = h("p", { className: "mp-status" }, t("restarting"));
    } else if (plugins === null) {
      body = h("p", { className: "mp-status" }, t("loading"));
    } else if (error) {
      body = h("p", { className: "mp-status" }, t("error"), " — ", error);
    } else if (!plugins.length) {
      body = h("p", { className: "mp-status" }, t("empty"));
    } else {
      body = h("ul", { className: "mp-cards" }, plugins.map(card));
    }

    return h(
      "div",
      null,
      h(
        "div",
        { className: "mp-toolbar" },
        h(
          "button",
          { className: "mp-btn", type: "button", disabled: restarted, onClick: () => refresh() },
          t("refresh"),
        ),
        h("span", { className: "mp-spacer" }),
        h(
          "button",
          {
            className: "mp-btn mp-danger",
            type: "button",
            disabled: restarted,
            onClick: () => setModal({ kind: "restart" }),
          },
          t("restart"),
        ),
      ),
      notice ? h("p", { className: `mp-notice mp-${notice.kind}` }, notice.text) : null,
      !restarted ? h("p", { className: "mp-hint" }, t("hint")) : null,
      body,
      modal
        ? h(
            "div",
            { className: "mp-overlay", onClick: () => setModal(null) },
            h(
              "div",
              {
                className: "mp-dialog",
                onClick: (ev: any) => ev.stopPropagation(),
              },
              h(
                "h3",
                { className: "mp-dialogTitle" },
                modal.kind === "restart" ? t("restart") : `${t("uninstall")} — ${modal.pkg}`,
              ),
              h(
                "p",
                { className: "mp-dialogBody" },
                modal.kind === "restart"
                  ? t("confirmRestart")
                  : t("uninstallConfirm").replace("{pkg}", modal.pkg),
              ),
              h(
                "div",
                { className: "mp-dialogActions" },
                h(
                  "button",
                  { className: "mp-btn", type: "button", onClick: () => setModal(null) },
                  t("cancel"),
                ),
                h(
                  "button",
                  {
                    className: "mp-btn mp-confirm",
                    type: "button",
                    onClick: () => {
                      const m = modal;
                      setModal(null);
                      if (m.kind === "restart") return doRestart();
                      return uninstallRow(m.pkg);
                    },
                  },
                  t("confirmOk"),
                ),
              ),
            ),
          )
        : null,
    );
  }

  return MyPluginsTab;
}