// Escape user-supplied strings before injecting into HTML templates
// (used by print/document.write flows) to prevent stored XSS.
export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Recursively clone an object/array, HTML-escaping every string leaf.
 * Numbers, booleans, dates, null, and undefined are passed through unchanged.
 * Use this when interpolating database records into HTML print templates.
 */
export const escapeHtmlObject = <T>(input: T): T => {
  if (input == null) return input;
  if (typeof input === "string") return escapeHtml(input) as unknown as T;
  if (Array.isArray(input)) return input.map((v) => escapeHtmlObject(v)) as unknown as T;
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = escapeHtmlObject(v);
    }
    return out as T;
  }
  return input;
};
