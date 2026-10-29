import { redirect } from "next/navigation";
import { homeSectionRoutes } from "@/lib/public-home-content";

export default function HowItWorksPage() {
  redirect(homeSectionRoutes.howItWorks);
}
