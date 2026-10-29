import { describe, expect, it } from "vitest";
import { copy } from "@/content/copy.generated";

describe("Host Home visual draft copy", () => {
  it("keeps the draft clearly local and non-persistent", () => {
    expect(copy["host.preview.notice"]).toContain("nothing is sent or saved");
    expect(copy["host.preview.local_result"]).toContain("No request was sent or saved");
  });

  it("defines property type as access context, not a pricing input", () => {
    expect(copy["host.preview.property_type_help"]).toContain("access only");
    expect(copy["host.preview.property_type_help"]).toContain("does not change the recommended pay");
  });

  it("does not invent a rate before service and area details are known", () => {
    expect(copy["host.preview.pay_pending"]).toContain("Shown after service and area details");
    expect(copy["host.preview.pay_help"]).toContain("You can raise it, not lower it");
  });
});
