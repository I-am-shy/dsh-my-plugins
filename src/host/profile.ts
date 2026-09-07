import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROFILE_DIR, PROFILE_PKG } from "./constants";

export interface ProfilePackage {
  dependencies?: Record<string, string>;
  dsh?: {
    profile?: {
      bundles?: string[];
    };
  };
  [key: string]: unknown;
}

/** Read the profile's package.json (deps + dsh.profile.bundles). */
export function readProfilePkg(): ProfilePackage {
  return JSON.parse(readFileSync(PROFILE_PKG, "utf8")) as ProfilePackage;
}

/** Packages the user installed themselves: the profile dependency keys. */
export function userDeps(): string[] {
  return Object.keys(readProfilePkg().dependencies ?? {});
}

/** Installed version, read live from node_modules (never cached). */
export function installedVersion(pkg: string): string {
  try {
    const pkgJson = JSON.parse(
      readFileSync(join(PROFILE_DIR, "node_modules", pkg, "package.json"), "utf8"),
    ) as { version?: string };
    return pkgJson.version ?? "?";
  } catch {
    return "?";
  }
}