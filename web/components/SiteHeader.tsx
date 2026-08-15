import Link from "next/link";
import Logo from "@/components/Logo";

// Header público compartido. Responsive: en mobile colapsa a un menú (nativo <details>,
// sin JS de cliente) para que los botones no se desborden en pantallas chicas.
export default function SiteHeader() {
  const links = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/panel", label: "Mi panel" },
  ];
  return (
    <header className="border-b border-nexo-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 text-base sm:text-lg">
          <Logo />
          <span className="rounded bg-nexo-accent/10 px-1.5 py-0.5 text-xs font-semibold text-nexo-greenDark">Directo</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-nexo">{l.label}</Link>
          ))}
          <Link href="/valuar" className="rounded-lg bg-nexo px-4 py-2 font-medium text-white hover:bg-nexo-dark">
            Valuá tu empresa
          </Link>
        </nav>

        {/* Mobile: menú desplegable nativo */}
        <details className="relative sm:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg border border-nexo-border p-2 text-slate-600 [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-nexo-border bg-white p-2 shadow-lg">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-nexo-soft">{l.label}</Link>
            ))}
            <Link href="/valuar" className="mt-1 block rounded-lg bg-nexo px-3 py-2 text-center text-sm font-medium text-white hover:bg-nexo-dark">
              Valuá tu empresa
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
