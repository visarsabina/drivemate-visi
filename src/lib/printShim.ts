// Print documents inside a hidden iframe instead of a new tab, so the app page
// never reloads or loses its state after printing.
export function installPrintShim() {
  const original = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (url && String(url) !== "" && String(url) !== "about:blank") return original(url, target, features);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const w = iframe.contentWindow!;
    let removed = false;
    const cleanup = () => { if (removed) return; removed = true; setTimeout(() => iframe.remove(), 500); };
    w.addEventListener("afterprint", cleanup);
    try { Object.defineProperty(w, "close", { value: cleanup, configurable: true }); } catch {}
    setTimeout(cleanup, 10 * 60 * 1000);
    return w;
  }) as typeof window.open;
}
