import Link from "next/link";

type SizaHeaderProps = { admin?: boolean };

export function SizaHeader({ admin = false }: SizaHeaderProps) {
  return <header className={admin ? "admin-header" : "starter-header"}><Link href={admin ? "/admin" : "/"}>siZa.</Link>{admin ? <nav><Link href="/admin/cleaners">Cleaners</Link><Link href="/admin/bookings">Bookings</Link></nav> : <Link href="/book">Request a clean</Link>}</header>;
}
