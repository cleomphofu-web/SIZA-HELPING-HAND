import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function provisionAdmin({
  email = process.env.ADMIN_NOTIFY_EMAIL || "sizahelpinghand@gmail.com",
  password,
  firstName = "Owner",
  lastName = "Admin",
  phone = "+27820000001",
}) {
  if (!password) {
    throw new Error("Password is required to provision admin");
  }

  // 1. Check if user already exists in auth.users
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  let user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log(`Creating auth user for ${email}...`);
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin", first_name: firstName, last_name: lastName },
    });
    if (createError) throw createError;
    user = createdUser.user;
  } else {
    console.log(`Updating password for existing user ${email}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
  }

  // 2. Upsert profile in public.profiles
  const now = new Date().toISOString();
  console.log(`Upserting profile for user ${user.id}...`);
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      role: "admin",
      first_name: firstName,
      last_name: lastName,
      phone,
      terms_version: "v1",
      terms_accepted_at: now,
      privacy_version: "v1",
      privacy_accepted_at: now,
      deleted_at: null,
      updated_at: now,
    },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  // 3. Insert into public.admins
  console.log(`Ensuring public.admins record exists for user ${user.id}...`);
  const { error: adminError } = await supabase.from("admins").upsert(
    {
      user_id: user.id,
      created_at: now,
    },
    { onConflict: "user_id" }
  );
  if (adminError) throw adminError;

  console.log(`Admin user successfully provisioned: ${email} (ID: ${user.id})`);
  return { id: user.id, email };
}

// CLI runner
if (process.argv[1]?.endsWith("provision-admin.mjs")) {
  const email = process.argv[2] || process.env.ADMIN_NOTIFY_EMAIL || "sizahelpinghand@gmail.com";
  const password = process.argv[3];

  if (!password) {
    console.log("Usage: node tools/admin/provision-admin.mjs <email> <password>");
    process.exit(1);
  }

  provisionAdmin({ email, password })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Provisioning failed:", err);
      process.exit(1);
    });
}

