import { t } from "@/content/t";

export type HelperMatchingNotice = "saved" | "failed" | "rate_limited" | "unavailable";

export function HelperGenderMatchingForm({
  currentGroup,
  enabled,
  status,
}: {
  currentGroup: "female" | "male" | null;
  enabled: boolean;
  status?: HelperMatchingNotice;
}) {
  return (
    <main className="phase-a-shell">
      <section className="phase-a-card" aria-labelledby="helper-matching-title">
        <p className="starter-eyebrow">SIZA / HELPER</p>
        <h1 id="helper-matching-title">{t("helper.matching.title")}</h1>
        <p className="starter-copy">{t("helper.matching.body")}</p>
        {status === "saved" && <p role="status" className="phase-a-notice">{t("helper.matching.saved")}</p>}
        {status === "failed" && <p role="alert" className="phase-a-notice">{t("helper.matching.failed")}</p>}
        {status === "rate_limited" && <p role="alert" className="phase-a-notice">{t("helper.matching.rate_limited")}</p>}
        {status === "unavailable" && <p role="alert" className="phase-a-notice">{t("helper.matching.unavailable")}</p>}
        {!enabled ? <p role="status" className="phase-a-notice">{t("helper.matching.unavailable")}</p> : <form className="phase-a-form" action="/api/helper/profile/matching-preference" method="post">
          <label htmlFor="genderMatchGroup">{t("helper.matching.choice")}</label>
          <select id="genderMatchGroup" name="genderMatchGroup" defaultValue={currentGroup ?? "none"}>
            <option value="none">{t("helper.matching.none")}</option>
            <option value="female">{t("helper.matching.female")}</option>
            <option value="male">{t("helper.matching.male")}</option>
          </select>
          <label className="phase-a-check">
            <input type="checkbox" name="consent" defaultChecked={currentGroup !== null} />
            {t("helper.matching.consent")}
          </label>
          <p className="phase-a-help">{t("helper.matching.privacy")}</p>
          <button className="phase-a-button" type="submit">{t("button.save")}</button>
        </form>}
      </section>
    </main>
  );
}
