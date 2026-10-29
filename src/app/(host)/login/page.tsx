import { AccountEntry } from "@/components/AccountEntry";
import { publicConfig } from "@/server/config/public";
import { prototypeRoutesEnabled } from "@/lib/prototype";

export default function LoginPage() {
  return (
    <AccountEntry
      areas={publicConfig.areas}
      enabled={prototypeRoutesEnabled()}
      mode="login"
      supportEmail={publicConfig.supportEmail}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
    />
  );
}
