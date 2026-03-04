import { redirect } from "next/navigation";

/** /admin → /admin/orders (middleware already ensures authentication) */
export default function AdminRootPage() {
  redirect("/admin/orders");
}
