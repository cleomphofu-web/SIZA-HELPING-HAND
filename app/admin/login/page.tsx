import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#191919] text-[#ffffff]">
      <div className="siza-shell grid min-h-screen items-center py-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
        <div><Link className="siza-wordmark" href="/">siZa<span aria-hidden="true">.</span></Link><p className="siza-label mt-16 text-[#e6e6e6]">SIZA / admin</p><h1 className="admin-title text-[#ffffff]">Sign in.</h1></div>
        <form className="siza-form" action="/api/admin/login" method="post">
          <div className="siza-field"><label htmlFor="email">Email</label><input id="email" required name="email" type="email" autoComplete="username" /></div>
          <div className="siza-field"><label htmlFor="password">Password</label><input id="password" required name="password" type="password" autoComplete="current-password" /></div>
          <button className="siza-button siza-button-yellow" type="submit">Sign in <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </main>
  );
}
