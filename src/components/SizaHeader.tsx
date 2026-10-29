import Link from "next/link";

export function SizaHeader() {
  return <header className="admin-header"><Link href="/admin">siZa.</Link><nav><Link href="/admin/helpers">Helpers</Link><Link href="/admin/bookings">Bookings</Link></nav></header>;
}
