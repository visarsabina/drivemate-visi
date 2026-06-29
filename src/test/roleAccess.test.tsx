/**
 * Role-based access tests.
 *
 * These tests assert that the route guards never let a user reach a
 * privileged area unless they actually hold the matching role. They cover
 * the most dangerous edge cases for admin escalation:
 *   - unauthenticated visitors
 *   - authenticated users with no role
 *   - candidates trying to reach admin/super-admin
 *   - instructors trying to reach super-admin
 *   - admins trying to reach super-admin
 *   - role flags that flip mid-render (roleChecked transitions)
 *
 * We mock useAuth/useIsSuperAdmin so the guards are tested in isolation
 * from the network. The server-side defence in depth (RLS + has_role +
 * is_super_admin + prevent_tenant_billing_change) lives in the database
 * and is enforced regardless of what the client believes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import CandidateRoute from "@/components/CandidateRoute";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/hooks/useIsSuperAdmin", () => ({
  useIsSuperAdmin: vi.fn(),
}));

import { useAuth } from "@/context/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseIsSuperAdmin = vi.mocked(useIsSuperAdmin);

const baseAuth = {
  session: null as unknown,
  user: null,
  isAdmin: false,
  isInstructor: false,
  isCandidate: false,
  roleChecked: true,
  loading: false,
  signOut: vi.fn(),
};

const setAuth = (overrides: Partial<typeof baseAuth>) => {
  mockedUseAuth.mockReturnValue({ ...baseAuth, ...overrides } as never);
};

const setSuper = (isSuperAdmin: boolean, loading = false) => {
  mockedUseIsSuperAdmin.mockReturnValue({
    isSuperAdmin,
    checked: !loading,
    loading,
  } as never);
};

const renderWithRoute = (
  guard: "admin" | "super" | "candidate",
  initial = "/protected",
) => {
  const Guarded =
    guard === "admin" ? ProtectedRoute : guard === "super" ? SuperAdminRoute : CandidateRoute;
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/admin" element={<div>ADMIN_PAGE</div>} />
        <Route
          path="/protected"
          element={
            <Guarded>
              <div>PRIVATE_CONTENT</div>
            </Guarded>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  setSuper(false);
});

describe("ProtectedRoute (admin/instructor area)", () => {
  it("redirects unauthenticated visitors to /auth", () => {
    setAuth({});
    renderWithRoute("admin");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
  });

  it("blocks an authenticated user with no role", () => {
    setAuth({ session: { user: { id: "u" } } });
    renderWithRoute("admin");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("blocks a candidate from the admin area", () => {
    setAuth({ session: { user: { id: "c" } }, isCandidate: true });
    renderWithRoute("admin");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
  });

  it("allows an admin", () => {
    setAuth({ session: { user: { id: "a" } }, isAdmin: true });
    renderWithRoute("admin");
    expect(screen.getByText("PRIVATE_CONTENT")).toBeInTheDocument();
  });

  it("allows an instructor", () => {
    setAuth({ session: { user: { id: "i" } }, isInstructor: true });
    renderWithRoute("admin");
    expect(screen.getByText("PRIVATE_CONTENT")).toBeInTheDocument();
  });

  it("shows the loading state while the role has not been checked yet (no premature access)", () => {
    setAuth({ session: { user: { id: "x" } }, roleChecked: false });
    const { container } = renderWithRoute("admin");
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
    expect(screen.queryByText("AUTH_PAGE")).not.toBeInTheDocument();
    // Spinner is rendered
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("SuperAdminRoute", () => {
  it("redirects unauthenticated visitors to /auth", () => {
    setAuth({});
    setSuper(false);
    renderWithRoute("super");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("redirects a plain admin to /admin (no escalation to super)", () => {
    setAuth({ session: { user: { id: "a" } }, isAdmin: true });
    setSuper(false);
    renderWithRoute("super");
    expect(screen.getByText("ADMIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
  });

  it("redirects an instructor to /admin", () => {
    setAuth({ session: { user: { id: "i" } }, isInstructor: true });
    setSuper(false);
    renderWithRoute("super");
    expect(screen.getByText("ADMIN_PAGE")).toBeInTheDocument();
  });

  it("redirects a candidate to /admin (still not super)", () => {
    setAuth({ session: { user: { id: "c" } }, isCandidate: true });
    setSuper(false);
    renderWithRoute("super");
    expect(screen.getByText("ADMIN_PAGE")).toBeInTheDocument();
  });

  it("allows a super admin", () => {
    setAuth({ session: { user: { id: "s" } } });
    setSuper(true);
    renderWithRoute("super");
    expect(screen.getByText("PRIVATE_CONTENT")).toBeInTheDocument();
  });

  it("does not leak content while the super-admin check is loading", () => {
    setAuth({ session: { user: { id: "s" } } });
    setSuper(false, true);
    renderWithRoute("super");
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
    expect(screen.queryByText("AUTH_PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("ADMIN_PAGE")).not.toBeInTheDocument();
  });
});

describe("CandidateRoute", () => {
  it("redirects unauthenticated visitors", () => {
    setAuth({});
    renderWithRoute("candidate");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("blocks an admin from the candidate portal (separation of duties)", () => {
    setAuth({ session: { user: { id: "a" } }, isAdmin: true });
    renderWithRoute("candidate");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
  });

  it("blocks an instructor from the candidate portal", () => {
    setAuth({ session: { user: { id: "i" } }, isInstructor: true });
    renderWithRoute("candidate");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("allows a candidate", () => {
    setAuth({ session: { user: { id: "c" } }, isCandidate: true });
    renderWithRoute("candidate");
    expect(screen.getByText("PRIVATE_CONTENT")).toBeInTheDocument();
  });
});

describe("Escalation hardening invariants", () => {
  it("a forged isAdmin flag in client state still cannot reach super-admin", () => {
    // Even if an attacker tampers with the client and pretends to be admin,
    // SuperAdminRoute only honours the server-checked is_super_admin RPC.
    setAuth({ session: { user: { id: "x" } }, isAdmin: true, isInstructor: true, isCandidate: true });
    setSuper(false);
    renderWithRoute("super");
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
    expect(screen.getByText("ADMIN_PAGE")).toBeInTheDocument();
  });

  it("a candidate flag set alongside admin=false still blocks the admin area", () => {
    setAuth({ session: { user: { id: "x" } }, isAdmin: false, isInstructor: false, isCandidate: true });
    renderWithRoute("admin");
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("loading state never reveals private content", () => {
    setAuth({ session: { user: { id: "x" } }, loading: true });
    renderWithRoute("admin");
    expect(screen.queryByText("PRIVATE_CONTENT")).not.toBeInTheDocument();
  });
});
