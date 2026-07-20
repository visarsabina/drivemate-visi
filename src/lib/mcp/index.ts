import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCandidates from "./tools/list-candidates";
import getCandidate from "./tools/get-candidate";
import listRegistrations from "./tools/list-registrations";
import listVehicles from "./tools/list-vehicles";
import listEmployees from "./tools/list-employees";
import listLicenses from "./tools/list-licenses";

// Direct Supabase host (not the .lovable.cloud proxy) — required by mcp-js OAuth verification.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "auto-shkolla-visi-mcp",
  title: "Auto Shkolla Visi MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for a driving-school management app. Callers act as the signed-in user (admin, instructor, or candidate) and only see data from their own driving school (tenant). Use list_candidates/get_candidate for people, list_registrations for online sign-ups, and list_vehicles/list_employees/list_licenses for fleet and staff info.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCandidates, getCandidate, listRegistrations, listVehicles, listEmployees, listLicenses],
});
