import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_candidates",
  title: "List candidates",
  description:
    "List candidates from the signed-in user's driving school. Results are scoped by tenant RLS. Supports optional name/personal-number search and pagination.",
  inputSchema: {
    search: z
      .string()
      .optional()
      .describe("Optional case-insensitive substring matched against first name, last name, or personal number."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
    offset: z.number().int().min(0).optional().describe("Row offset for pagination (default 0)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ search, limit, offset }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = sbForUser(ctx);
    const take = limit ?? 50;
    const skip = offset ?? 0;
    let q = sb
      .from("candidates")
      .select(
        "id, emri, mbiemri, numri_personal, telefon, kategoria, statusi, numri_regjistrimit, data_regjistrimit, shuma_marreveshjes, total_lessons",
        { count: "exact" },
      )
      .order("data_regjistrimit", { ascending: false })
      .range(skip, skip + take - 1);
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`emri.ilike.${s},mbiemri.ilike.${s},numri_personal.ilike.${s}`);
    }
    const { data, error, count } = await q;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ count, rows: data }) }],
      structuredContent: { count: count ?? 0, rows: data ?? [] },
    };
  },
});
