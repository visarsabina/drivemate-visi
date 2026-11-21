import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useSchoolGallery } from "@/hooks/useSchoolGallery";

const calls = vi.hoisted(() => ({ eq: vi.fn(), signed: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: calls.from,
  storage: { from: () => ({ createSignedUrls: calls.signed }) },
} }));

describe("school-isolated gallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = { select: () => query, eq: calls.eq, order: () => query, then: (resolve: (result: unknown) => void) => resolve({ data: [{ id: "photo-a", image_path: "school-a/photo.jpg" }], error: null }) };
    calls.eq.mockReturnValue(query);
    calls.from.mockReturnValue(query);
    calls.signed.mockResolvedValue({ data: [{ path: "school-a/photo.jpg", signedUrl: "https://example.test/signed-photo" }], error: null });
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

  it("queries only the selected school and signs its photo for one hour", async () => {
    const { result } = renderHook(() => useSchoolGallery("school-a"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls.eq).toHaveBeenCalledWith("tenant_id", "school-a");
    expect(calls.signed).toHaveBeenCalledWith(["school-a/photo.jpg"], 3600);
    expect(result.current.data?.[0].imageUrl).toBe("https://example.test/signed-photo");
  });

  it("does not fetch gallery data before the school is resolved", () => {
    renderHook(() => useSchoolGallery(null), { wrapper });
    expect(calls.from).not.toHaveBeenCalled();
  });
});