# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-04

### Changed

- Split the monolithic `lib/index.js` / `client/client.js` into documented
  TypeScript modules under `src/host/` and `src/client/`.
- Added an esbuild build pipeline (`npm run build`, `npm run build:watch`)
  plus a strict `tsc --noEmit` typecheck.
- Reworked the repository into open-source standard layout: README, LICENSE,
  CHANGELOG, `.gitignore`, npm metadata (`repository`, `keywords`, scripts).
- Replaced the inline notice paragraph with floating toast notifications:
  enter/leave transitions, a manual close button, and no layout shift (the
  toast is positioned out of the document flow). Kind-specific colors and
  copy: green 已启用 (enabled), yellow 已关闭 (disabled), gray restarting
  notice, red errors.

### Fixed

- Behaviour parity preserved through the refactor: group-safe entry handling,
  runtime-id vs patch-row-id separation, self-disable guard, boot-time state
  self-heal, `--no-open` restart respawn, 3-streak restart poll.

## [0.1.0] - 2026-03

### Added

- Initial release: 我的插件 panel under Settings → Plugins.
- View / enable / disable / uninstall for user-installed plugins.
- Patch-layer persistence (survives restarts) with managed block markers.
- Same-origin `/my-plugins` HTTP API (loopback + Origin guarded).
- Audit log and detached dsh web restart helper.