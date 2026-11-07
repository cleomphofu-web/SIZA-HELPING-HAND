import { AccountEntry } from "@/components/AccountEntry";
import { publicConfig } from "@/server/config/public";
import { prototypeRoutesEnabled } from "@/lib/prototype";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; verified?: string }>;
}) {
  const params = await searchParams;
  return (
    <AccountEntry
      areas={publicConfig.areas}
      enabled={prototypeRoutesEnabled()}
      mode="login"
      supportEmail={publicConfig.supportEmail}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      initialError={params?.error}
      initialVerified={params?.verified === "1" || params?.verified === "true"}
    />
  );
}
