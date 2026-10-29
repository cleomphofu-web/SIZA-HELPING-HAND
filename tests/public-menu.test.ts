import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicMenu } from "@/components/PublicMenu";

describe("public menu hydration", () => {
  it("server-renders the menu closed with an explicit controlled state", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicMenu, {
        links: [{ href: "/about", label: "About us" }],
        menuLabel: "Menu",
      }),
    );

    expect(markup).toContain('<details class="public-menu"');
    expect(markup.match(/<details\b[^>]*\bopen(?:\s|=|>)/)).toBeNull();
    expect(markup).toContain('aria-label="Menu"');
    expect(markup).toContain('href="/about"');
  });
});
