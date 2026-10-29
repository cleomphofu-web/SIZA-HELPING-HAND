import { redirect } from "next/navigation";

export default function ApplyPage() {
  redirect("/signup?role=helper");
}
