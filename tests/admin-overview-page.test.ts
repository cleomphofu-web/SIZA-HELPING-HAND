import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ getAdminOverview: vi.fn() }));

vi.mock("@/server/views/admin-overview", () => ({ getAdminOverview: mocks.getAdminOverview }));
vi.mock("@/components/AdminShell", () => ({ AdminShell: ({ children }: { children: ReactNode }) => createElement("div", null, children) }));

import AdminOverviewPage from "@/app/(admin)/admin/overview/page";

describe("admin overview page", () => {
  beforeEach(() => mocks.getAdminOverview.mockReset());

  it("renders aggregate counts and useful links to existing admin queues", async () => {
    mocks.getAdminOverview.mockResolvedValue({ ok: true, data: {
      hosts: 12,
      helpers: { pending: 3, approved: 8, declined: 2, suspended: 1 },
      bookings: { open: 4, assigned: 5, inProgress: 2, completed: 24 },
      reportsToReview: 3,
    } });

    const html = renderToStaticMarkup(await AdminOverviewPage());
    expect(html).toContain("Marketplace snapshot");
    expect(html).toContain("They do not show who is online right now.");
    expect(html).toContain("12</strong><span>Registered hosts</span>");
    expect(html).toContain("3</strong><span>Reports to review</span>");
    expect(html).toContain('href="/admin/helpers"');
    expect(html).toContain('href="/admin/bookings"');
    expect(html).toContain('href="/admin/reports"');
    expect(html).not.toContain("@example");
  });

  it("shows a safe error and retry link instead of false zero counts", async () => {
    mocks.getAdminOverview.mockResolvedValue({ ok: false, error: { code: "internal_error", message: "The overview could not load. Try reloading the page." } });
    const html = renderToStaticMarkup(await AdminOverviewPage());
    expect(html).toContain("The overview could not load");
    expect(html).toContain('href="/admin/overview"');
    expect(html).not.toContain("Registered hosts");
  });
});
