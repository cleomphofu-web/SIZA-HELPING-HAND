import { HostHomeDraft } from "@/components/prototypes/HostHomeDraft";
import { t } from "@/content/t";

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    return <main className="review-unavailable">{t("host.preview.production_unavailable")}</main>;
  }

  return <HostHomeDraft />;
}
