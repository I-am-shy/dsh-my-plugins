# dsh-my-plugins

A **“My Plugins” manager for DSH** — view, enable, disable, and uninstall
*only the plugins you installed*, from a tab inside the official
**Settings → Plugins** section, styled pixel-consistently with the built-in
plugin list (light and dark mode).

> 中文简介:「我的插件」管理面板。只管理你自己安装的插件(查看 / 启用 / 关闭 / 卸载),
> 挂载在官方「设置 → 插件」区,样式与官方插件清单完全一致。

## Features

- **Your plugins only** — lists `profile dependencies ∩ loader entries`; DSH's
  built-in plugins are never shown or touched.
- **Live toggle** — enable/disable applies immediately through the Cordis
  loader *and* persists to the profile's `cordis.patch.yml`, so it survives
  restarts.
- **Uninstall with cleanup** — runs `dsh plugin remove`, repairs any leftover
  `dsh.profile.bundles` row, and hot-removes the runtime entry.
- **One-click restart** — restarts `dsh web` from inside the panel and reloads
  the current page once the server is back.
- **Official look & feel** — cards, status dot, tags, hover/active states and
  single-expand behaviour mirror the official plugin inventory, using the app
  theme variables (`--dsw-alias-*`).
- **Safety first** — grouped loader entries can never be targeted, the panel
  refuses to disable itself, HTTP only accepts loopback + same-origin
  requests, and every operation is written to an audit log.

## Installation

```bash
dsh plugin --profile web add dsh-my-plugins
```

Then open (or restart) the DSH web interface and go to
**Settings → Plugins → 我的插件 (My plugins)**.

> The tab sits **last**, after the official 可配置 (Configurable) and
> 插件列表 (All plugins) tabs.

## Usage

| Action | How |
| --- | --- |
| **View** status/version/Cordis phase | click a card to expand it |
| **Disable / enable** a plugin | expand the card → **关闭 / 启用** |
| **Uninstall** a plugin | expand the card → **卸载**, confirm in the dialog |
| **Restart dsh web** (to finish an uninstall) | toolbar → **重启 dsh web** |

A green dot + 「已启用」 tag means enabled; disabled plugins show only the
「已停用」 tag — exactly like the official list.

## How it works

```
┌─ DSH web (browser) ─────────────────────────────┐
│ Settings → Plugins → 我的插件 tab                 │
│   React component (bundled client/client.js)     │
│   │  fetch /my-plugins/*  (same-origin)          │
└──┬───────────────────────────────────────────────┘
   ▼
┌─ Host side (lib/index.js, runs inside dsh web) ──┐
│  routes.ts   HTTP API (loopback + Origin check)  │
│  loader.ts   profile deps ∩ loader entries       │
│  operations  loader.update / dsh remove / bundles│
│  patch.ts    persistence → cordis.patch.yml      │
│  restart.ts  detached respawn helper             │
│  audit.ts    $DSH_HOME/dsh-my-plugins/audit.jsonl│
└──────────────────────────────────────────────────┘
```

### Persistence

Disabled plugins are written as a managed block inside the profile's
`<profile>/cordis.patch.yml`:

```yaml
# dsh-my-plugins managed begin
- id: <entryId>
  disabled: true
# dsh-my-plugins managed end
```

The block owns the whole array body; deleting it re-enables everything.

> The panel also mirrors state to `$DSH_HOME/dsh-my-plugins/state.json` and
> validates it against the live loader tree at boot (self-heal).

### Runtime ids vs patch-row ids

Loader entries inside dependency groups carry prefixed runtime ids
(e.g. `include:dsh-pocket`). The Cordis loader resolves those `a:b` nested ids
natively, so runtime updates use the raw id, while rows persisted to the
patch layer use the plain id (the last `:`-separated segment).

## HTTP API (same-origin, loopback only)

| Endpoint | Method | Body | Effect |
| --- | --- | --- | --- |
| `/my-plugins/list` | GET | — | plugins + profile + port |
| `/my-plugins/set-enabled` | POST | `{pkg, enabled}` | enable/disable + persist |
| `/my-plugins/uninstall` | POST | `{pkg}` | uninstall + cleanup |
| `/my-plugins/restart` | POST | `{}` | respawn dsh web |

## Project structure

```
dsh-my-plugins/
├── src/
│   ├── host/                  # Node side (bundled → lib/index.js, ESM)
│   │   ├── index.ts           #   entry: inject + apply + self-heal
│   │   ├── constants.ts       #   paths, patch markers, fiber phases
│   │   ├── types.ts           #   service/state/row types
│   │   ├── audit.ts           #   append-only audit log
│   │   ├── profile.ts         #   profile package.json helpers
│   │   ├── patch.ts           #   cordis.patch.yml render + state io
│   │   ├── loader.ts          #   entry discovery (group-safe)
│   │   ├── operations.ts      #   enable/disable/uninstall
│   │   ├── restart.ts         #   detached respawn helper
│   │   └── routes.ts          #   /my-plugins HTTP API
│   └── client/                # Web tab (bundled → client/client.js, CJS)
│       ├── index.ts           #   __ModuleLoader__ registration
│       ├── app.ts             #   slots + locale + style wiring
│       ├── component.ts       #   the tab component
│       ├── api.ts             #   same-origin RPC
│       ├── locales.ts         #   zh / en dictionaries
│       └── styles.ts          #   theme-variable CSS
├── lib/index.js               # built host bundle (committed)
├── client/client.js           # built client bundle (committed)
├── scripts/build.mjs          # esbuild pipeline (+ --watch)
├── tsconfig.json              # strict TS, noEmit typecheck
├── cordis.patch.yml           # entry insert (host-side manifest)
├── package.json               # dsh manifest + npm metadata
└── LICENSE                    # MIT
```

## Development

```bash
git clone git@github.com:I-am-shy/dsh-my-plugins.git
cd dsh-my-plugins
npm install

npm run build        # rebuild lib/index.js + client/client.js
npm run build:watch  # rebuild on change
npm run typecheck    # tsc --noEmit strict check
```

Both bundles are committed, so consumers install the package directly with
no build step. For a zero-copy local dev loop against a live dsh web:

```bash
# register into the profile once
dsh plugin --profile web add file:/path/to/dsh-my-plugins

# replace the pnpm hardlink with a symlink (avoids the stale-copy trap)
rm -rf ~/.dsh/profiles/web/node_modules/dsh-my-plugins
ln -s /path/to/dsh-my-plugins ~/.dsh/profiles/web/node_modules/dsh-my-plugins
```

## Troubleshooting

### Changes do not appear in the panel

The profile keeps a hardlink copy of the package; edits made with tools that
replace the file inode leave the installed copy stale. Run `npm run build`
and either reinstall, or use the symlink loop above.

### A disabled plugin is enabled again after a restart

The persistence block lives in the *profile's* `cordis.patch.yml`
(`~/.dsh/profiles/web/cordis.patch.yml`). If the file was regenerated or the
block deleted, state resets — that is by design (deleting the block re-enables
everything).

## Known limits

- Uninstalling takes full effect only after the dsh web restart (the panel
  offers it inline).
- `loader.update` is an entry-level hot restart; for plugins with persistent
  services a clean dsh web restart is recommended after big changes.
- Only packages listed in the profile `dependencies` are manageable —
  native/bundled DSH plugins are out of scope on purpose.

## Contributing

Issues and PRs welcome. Keep `npm run typecheck` clean, and regenerate the
bundles by committing the output of `npm run build`.

## License

[MIT](LICENSE) © 2026 I-am-shy