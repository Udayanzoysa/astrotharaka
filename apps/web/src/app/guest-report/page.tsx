import { redirect } from "next/navigation";

/** Old instant-report URL — home form is the single entry point. */
export default function GuestReportRedirectPage() {
  redirect("/");
}
