import { describe, expect, it } from "vitest";
import { viewHostProfileForActor, type HostProfileRecord } from "@/server/views/host-profile";

const profile: HostProfileRecord = {
  userId: "host-1",
  addressLine: "12 Example Road",
  suburb: "Braamfontein",
  city: "Johannesburg",
  notesDefault: "Call on arrival",
};

describe("host profile view", () => {
  it("returns only the signed-in host's editable profile fields", () => {
    expect(viewHostProfileForActor(profile, { userId: "host-1", role: "host" })).toEqual({
      addressLine: "12 Example Road",
      suburb: "Braamfontein",
      city: "Johannesburg",
      notesDefault: "Call on arrival",
    });
  });

  it("denies wrong-role and wrong-owner reads", () => {
    expect(viewHostProfileForActor(profile, { userId: "host-1", role: "helper" })).toBeNull();
    expect(viewHostProfileForActor(profile, { userId: "host-2", role: "host" })).toBeNull();
  });

  it("returns an empty editable profile only to the authenticated host during onboarding", () => {
    expect(viewHostProfileForActor(null, { userId: "host-1", role: "host" })).toEqual({
      addressLine: "", suburb: "", city: "Johannesburg", notesDefault: "",
    });
  });
});
