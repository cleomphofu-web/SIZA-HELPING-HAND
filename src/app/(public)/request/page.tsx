import { redirect } from "next/navigation";

export default function RequestPage() {
  redirect("/signup?role=host");
}
