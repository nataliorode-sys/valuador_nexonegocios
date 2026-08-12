import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <main>
      {/* Header */}
      <header className="border-b border-nexo-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg">
            <Logo />
            <span className="rounded bg-nexo-accent/10 px-1.5 py-0.5 text-xs font-semibold text-nexo-greenDark">Directo</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/marketplace" className="text-slate-600 hover:text-nexo">
              Marketplace
            </Link>
            <Link href="/panel" className="text-slate-600 hover:text-nexo">
              Mi panel
            </Link>
            <Link
              href="/valuar"
              className="rounded-lg bg-nexo px-4 py-2 font-medium text-white hover:bg-nexo-dark"
            >
              Valuá tu empresa
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-nexo-soft">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-nexo md:text-5xl">
            Valuá y vendé tu empresa, sin importar el tamaño ni el rubro
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Completá los datos de tu negocio paso a paso y obtené una orientación de valuación
            profesional, un informe en PDF, publicación en nuestro Marketplace y un flyer para
            difundir. Vos manejás el contacto directo con los interesados.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/valuar"
              className="rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark"
            >
              Empezá tu valuación
            </Link>
            <Link
              href="/marketplace"
              className="rounded-lg border border-nexo px-6 py-3 font-semibold text-nexo hover:bg-white"
            >
              Ver empresas en venta
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Servicio NexoDirecto · valor desde $180.000 + IVA
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { n: "1", t: "Cargá tu negocio", d: "Respondé en criollo: ventas, costos, activos. Sin tecnicismos." },
            { n: "2", t: "Obtené tu valor", d: "Calculamos un rango de valuación en USD y ARS con método profesional." },
            { n: "3", t: "Publicá 100 días", d: "Tu empresa aparece en el Marketplace de NexoNegocios." },
            { n: "4", t: "Difundí y vendé", d: "Compartí tu flyer y recibí consultas directas de compradores." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-slate-100 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexo text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferenciacion */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Un servicio pensado para cada tipo de empresa
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border-2 border-nexo bg-white p-8">
              <div className="text-sm font-semibold text-nexo-accent">NEXODIRECTO</div>
              <h3 className="mt-2 text-xl font-bold">Autogestión, contacto directo</h3>
              <p className="mt-3 text-slate-600">
                Para negocios más chicos que quieren valuar y vender por su cuenta. Vos cargás la
                información, nosotros te damos la orientación y las herramientas.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="text-sm font-semibold text-slate-500">SERVICIO FULL</div>
              <h3 className="mt-2 text-xl font-bold">Intermediación profesional</h3>
              <p className="mt-3 text-slate-600">
                Para operaciones que necesitan acompañamiento: información verificada, un asesor
                dedicado y gestión completa de la venta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-nexo-border bg-nexo-soft">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Logo className="text-base" />
          <p className="mt-3 text-sm text-nexo-muted">
            © NexoNegocios · NexoDirecto es una orientación basada en información provista por el
            propietario, no verificada. No constituye tasación ni asesoramiento.
          </p>
        </div>
      </footer>
    </main>
  );
}
