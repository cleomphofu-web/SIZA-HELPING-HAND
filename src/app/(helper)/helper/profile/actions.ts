"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";

export async function updateHelperBio(bio: string) {
  const actor = await requireActor();
  if (actor.role !== "helper") throw new Error("unauthorized");
  const sanitized = bio.trim().slice(0, 1000);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("helper_details")
    .update({ bio: sanitized })
    .eq("user_id", actor.userId);
  if (error) throw new Error("Failed to update bio");
  revalidatePath("/helper/profile");
  return { success: true };
}

