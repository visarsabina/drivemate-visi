import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_registrations",
  title: "List online registrations",
  description: "List online registration requests submitted through the public site. Scoped by tenant RLS.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit, offset }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = sbForUser(ctx);
    const take = limit ?? 50;
    const skip = offset ?? 0;
    const { data, error, count } = await sb
      .from("registrations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(skip, skip + take - 1);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ count, rows: data }) }],
      structuredContent: { count: count ?? 0, rows: data ?? [] },
    };
  },
});
