import { AccountEntry } from "@/components/AccountEntry";
import { publicConfig } from "@/server/config/public";
import { accountEntryRole } from "@/lib/account-entry";
import { prototypeRoutesEnabled } from "@/lib/prototype";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  return (
    <AccountEntry
      areas={publicConfig.areas}
      enabled={prototypeRoutesEnabled()}
      mode="signup"
      role={accountEntryRole(params.role)}
      supportEmail={publicConfig.supportEmail}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
    />
  );
}
