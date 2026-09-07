import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { NAME, PROFILE, PROFILE_PKG } from "./constants";
import { audit } from "./audit";
import { findEntryId } from "./loader";
import { patchRowId, renderPatchLayer, saveState } from "./patch";
import { readProfilePkg, userDeps } from "./profile";
import type { LoaderLike, MyPluginsState } from "./types";

export interface SetEnabledResult {
  pkg: string;
  entryId: string;
  enabled: boolean;
  disabled: boolean;
}

/**
 * Enable/disable a plugin: live `loader.update` plus persistence into the
 * profile patch layer (survives dsh web restarts).
 *
 * Guardrails: only profile-dependency packages may be touched, the panel may
 * not disable itself, and the target entry is resolved group-safely.
 */
export function setEnabled(
  loader: LoaderLike,
  state: MyPluginsState,
  pkg: string,
  enabled: boolean,
): SetEnabledResult {
  if (!userDeps().includes(pkg)) {
    throw new Error(`拒绝操作：${pkg} 不在「你安装的插件」清单里`);
  }
  if (pkg === NAME) {
    throw new Error(
      "「我的插件」面板不能关闭自身（会被持久化为 disabled，无法再从界面恢复）",
    );
  }
  const entryId = findEntryId(loader, pkg);
  if (!entryId) {
    throw new Error(`运行时条目未找到：${pkg}（可能未被 loader 载入）`);
  }
  loader.update(entryId, { disabled: !enabled });

  if (enabled) {
    delete state.disabled[entryId];
    delete state.disabled[pkg];
  } else {
    state.disabled[entryId] = true;
  }
  saveState(state);
  renderPatchLayer(state);
  audit(enabled ? "enable" : "disable", { pkg, entryId });

  return { pkg, entryId: patchRowId(entryId), enabled, disabled: !enabled };
}

export interface UninstallResult {
  pkg: string;
  removed: boolean;
  restartRequired: boolean;
}

/**
 * Uninstall a plugin: `dsh plugin remove` (pnpm removal), a failsafe cleanup
 * of any leftover `dsh.profile.bundles` row, and a runtime `loader.remove`.
 * Structural removal — the response flags that a restart completes it.
 */
export function uninstallPackage(
  loader: LoaderLike,
  state: MyPluginsState,
  pkg: string,
): UninstallResult {
  if (!userDeps().includes(pkg)) {
    throw new Error(`拒绝操作：${pkg} 不在「你安装的插件」清单里`);
  }

  try {
    execFileSync("dsh", ["plugin", "--profile", PROFILE, "remove", pkg], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    // CLI removal failing is not fatal: the failsafe bundle cleanup and the
    // runtime loader.remove below still run.
  }

  const profile = readProfilePkg();
  const bundles = profile.dsh?.profile?.bundles;
  if (Array.isArray(bundles) && bundles.includes(pkg)) {
    profile.dsh!.profile!.bundles = bundles.filter((bundle) => bundle !== pkg);
    writeFileSync(PROFILE_PKG, JSON.stringify(profile, null, 2) + "\n");
  }

  const entryId = findEntryId(loader, pkg);
  if (entryId) {
    try {
      loader.remove(entryId);
    } catch {
      /* already-unloaded entries may refuse a hot removal — ignore */
    }
    delete state.disabled[entryId];
  }
  delete state.disabled[pkg];
  saveState(state);
  renderPatchLayer(state);
  audit("uninstall", { pkg, entryId });

  return { pkg, removed: true, restartRequired: true };
}