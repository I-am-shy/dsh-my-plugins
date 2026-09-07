/**
 * Same-origin RPC against the host-side /my-plugins API.
 *
 * The host only accepts loopback + same-origin requests, so no credentials or
 * cross-origin handling is needed. Every response body is JSON with either
 * `ok: true` plus payload fields, or `ok: false` plus a human-readable message.
 */
export async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = body
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };

  const res = await fetch("/my-plugins" + path, init);
  const data: any = await res
    .json()
    .catch(() => ({ ok: false, message: `${res.status} ${res.statusText}` }));

  if (!res.ok || data.ok === false) {
    throw new Error(data.message || res.statusText);
  }
  return data as T;
}