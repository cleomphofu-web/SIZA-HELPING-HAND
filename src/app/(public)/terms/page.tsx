import Link from "next/link";
import { t } from "@/content/t";

export default function TermsPage() {
  return <main className="starter-shell"><p className="starter-eyebrow">TERMS</p><h1>{t("legal.terms.title")}</h1><p className="starter-copy">{t("legal.terms.body")}</p><Link className="starter-link" href="/">Back to home</Link></main>;
}
