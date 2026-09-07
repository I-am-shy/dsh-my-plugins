/**
 * Panel stylesheet, injected once into <head> by the app entry.
 *
 * Every color comes from the app theme variables (--dsw-alias-*) so the panel
 * stays pixel-consistent with the official plugin inventory in both light and
 * dark mode. Structural class names mirror the official inventory cards.
 */
export const CSS = [
  // ---- hint / toolbar / buttons (theme variables) ----
  ".mp-hint{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;margin:0 0 12px}",
  ".mp-toolbar{display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap}",
  ".mp-toolbar .mp-spacer{flex:1}",
  ".mp-btn{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;line-height:1.6}",
  ".mp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
  ".mp-btn:disabled{opacity:.45;cursor:not-allowed}",
  ".mp-btn.mp-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent)}",
  ".mp-btn.mp-danger:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent)}",
  ".mp-btn.mp-confirm{background:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary);color:#fff}",
  ".mp-btn.mp-confirm:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 85%, #000)}",
  ".mp-notice{margin:0 0 12px;padding:8px 12px;border-radius:8px;font-size:13px}",
  ".mp-notice.mp-ok{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent);color:var(--dsw-alias-label-secondary)}",
  ".mp-notice.mp-err{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);color:var(--dsw-alias-state-error-primary)}",
  // ---- cards (same variables/structure as the official invlist) ----
  ".mp-cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:10px}",
  ".mp-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;min-width:0;overflow:hidden}",
  ".mp-card[data-open=true]{border-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-shadow-lv1)}",
  ".mp-cardContent{box-sizing:border-box;width:100%;min-height:52px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;display:flex}",
  ".mp-cardContent:hover,.mp-card[data-open=true]>.mp-cardContent{background:var(--dsw-alias-interactive-bg-hover)}",
  ".mp-cardContent:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}",
  ".mp-cardTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;line-height:20px;overflow:hidden}",
  ".mp-cardTrailing{color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;gap:7px;display:inline-flex}",
  ".mp-statusDot{background:var(--dsw-alias-label-tertiary);border-radius:999px;flex:none;width:7px;height:7px;display:inline-block}",
  ".mp-statusDot[data-phase=active]{background:var(--dsw-alias-state-success-primary)}",
  ".mp-statusDot[data-phase=failed]{background:var(--dsw-alias-state-error-primary)}",
  ".mp-statusDot[data-phase=loading]{background:var(--dsw-alias-state-business-primary)}",
  ".mp-configTag{background:var(--dsw-alias-bg-layer-1);min-height:20px;color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:5px;align-items:center;padding:1px 6px;font-size:11px;line-height:16px;display:inline-flex}",
  ".mp-configTag[data-enabled=true]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);color:var(--dsw-alias-state-success-primary)}",
  ".mp-chevron{color:var(--dsw-alias-label-tertiary);flex:none}",
  ".mp-card[data-open=true] .mp-chevron{transform:rotate(180deg)}",
  "@media (prefers-reduced-motion:no-preference){.mp-chevron{transition:transform .14s var(--ds-ease-in-out)}}",
  ".mp-cardDetails{border-top:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);padding:10px 14px 12px}",
  ".mp-entryValue{overflow-wrap:anywhere;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code);font-size:12px;line-height:18px;display:block;margin:0 0 6px}",
  ".mp-details{grid-template-columns:76px minmax(0,1fr);gap:6px 10px;margin:0;display:grid}",
  ".mp-details div{display:contents}",
  ".mp-details dt{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px}",
  ".mp-details dd{overflow-wrap:anywhere;min-width:0;color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:17px}",
  ".mp-actions{display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l2);margin-top:10px;padding-top:10px}",
  ".mp-status{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;margin:.5em 0 0;text-align:center}",
  "@media (width<=680px){.mp-cards{grid-template-columns:minmax(0,1fr)}}",
  // ---- modal ----
  ".mp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000}",
  ".mp-dialog{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:18px 20px 14px;max-width:420px;width:calc(100vw - 48px);box-shadow:var(--dsw-shadow-lv1)}",
  ".mp-dialogTitle{margin:0 0 8px;font-size:14px;font-weight:600;line-height:20px}",
  ".mp-dialogBody{margin:0 0 14px;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-secondary);word-break:break-all}",
  ".mp-dialogActions{display:flex;justify-content:flex-end;gap:8px}",
].join("\n");