import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HostAppLoading from "../src/app/(host)/app/loading";

describe("host home loading state", () => {
  it("announces that the host request dashboard is loading", () => {
    const markup = renderToStaticMarkup(createElement(HostAppLoading));
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading your requests");
  });
});
