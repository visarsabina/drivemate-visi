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
  name: "get_candidate",
  title: "Get candidate",
  description: "Fetch full details for one candidate by id, including payments, lessons, and exams. Scoped by RLS.",
  inputSchema: {
    id: z.string().uuid().describe("Candidate id (uuid)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = sbForUser(ctx);
    const [candidate, payments, lessons, exams] = await Promise.all([
      sb.from("candidates").select("*").eq("id", id).maybeSingle(),
      sb.from("candidate_payments").select("*").eq("candidate_id", id).order("data_pageses", { ascending: false }),
      sb.from("candidate_lessons").select("*").eq("candidate_id", id).order("data_orës", { ascending: false }),
      sb.from("candidate_exams").select("*").eq("candidate_id", id).order("data_provimit", { ascending: false }),
    ]);
    if (candidate.error)
      return { content: [{ type: "text", text: candidate.error.message }], isError: true };
    if (!candidate.data)
      return { content: [{ type: "text", text: "Candidate not found" }], isError: true };
    const payload = {
      candidate: candidate.data,
      payments: payments.data ?? [],
      lessons: lessons.data ?? [],
      exams: exams.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
