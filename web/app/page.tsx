import Link from "next/link";
import Logo from "@/components/Logo";

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-none" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#45B649" opacity="0.15" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="#2F8F38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PASOS = [
  { icon: "📝", t: "Cargá tu negocio", d: "Respondé en criollo: ventas, costos, activos. Sin tecnicismos." },
  { icon: "📊", t: "Obtené tu valor", d: "Calculamos un rango de valuación en USD y ARS con método profesional." },
  { icon: "🏪", t: "Publicá 100 días", d: "Tu empresa aparece en el Marketplace de NexoNegocios." },
  { icon: "📣", t: "Difundí y vendé", d: "Compartí tu flyer y recibí consultas directas de compradores." },
];

const INCLUYE = [
  "Orientación de valuación con método profesional (USD y ARS)",
  "Informe completo en PDF, para entender tu valor",
  "Publicación 100 días en el Marketplace de NexoNegocios",
  "Flyer para difundir por WhatsApp y redes",
];

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-nexo-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg">
            <Logo />
            <span className="rounded bg-nexo-accent/10 px-1.5 py-0.5 text-xs font-semibold text-nexo-greenDark">Directo</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/marketplace" className="text-slate-600 hover:text-nexo">Marketplace</Link>
            <Link href="/panel" className="text-slate-600 hover:text-nexo">Mi panel</Link>
            <Link href="/valuar" className="rounded-lg bg-nexo px-4 py-2 font-medium text-white hover:bg-nexo-dark">
              Valuá tu empresa
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-nexo-soft">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-nexo-accent/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-nexo/5" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full bg-nexo-accent/15 px-3 py-1 text-xs font-semibold text-nexo-greenDark">
              Sin importar el tamaño ni el rubro
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-nexo md:text-5xl">
              Valuá y <span className="text-nexo-accent">vendé</span> tu empresa
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Completá los datos de tu negocio paso a paso y obtené todo lo que necesitás para vender
              por tu cuenta:
            </p>
            <ul className="mt-5 space-y-2.5">
              {INCLUYE.map((i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <Check /> <span>{i}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/valuar" className="rounded-lg bg-nexo-greenDark px-6 py-3 font-semibold text-white shadow-sm hover:brightness-110">
                Empezá tu valuación
              </Link>
              <Link href="/marketplace" className="rounded-lg border border-nexo px-6 py-3 font-semibold text-nexo hover:bg-white">
                Ver empresas en venta
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Servicio NexoDirecto · <span className="font-semibold text-nexo">$150.000</span> (precio final)
            </p>
          </div>

          {/* Tarjeta visual del hero */}
          <div className="relative hidden md:block">
            <div className="rounded-2xl border border-nexo-border bg-white p-6 shadow-lg">
              <div className="text-xs uppercase text-slate-400">Valor orientativo</div>
              <div className="mt-1 text-4xl font-extrabold text-nexo">USD 150.000</div>
              <div className="text-slate-500">Rango: USD 130.000 – 170.000</div>
              <div className="mt-4 h-2 w-full rounded-full" style={{ background: "linear-gradient(90deg,#EAF2FB,#45B649)" }} />
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                {["Conservador", "Base", "Optimista"].map((s, i) => (
                  <div key={s} className={`rounded-lg border p-2 ${i === 1 ? "border-nexo bg-nexo-soft font-semibold text-nexo" : "border-nexo-border text-slate-500"}`}>{s}</div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Rentabilidad demostrada", "8 años en marcha", "Baja dependencia"].map((c) => (
                  <span key={c} className="rounded-full border border-nexo-border px-2.5 py-1 text-xs text-slate-600">✓ {c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
        <p className="mt-2 text-center text-slate-500">En 4 pasos simples, desde tu compu.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {PASOS.map((s, i) => (
            <div key={s.t} className="relative rounded-xl border border-nexo-border bg-white p-6 transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexo-accent/12 text-2xl">{s.icon}</div>
              <div className="mt-4 text-xs font-bold text-nexo-accent">PASO {i + 1}</div>
              <h3 className="mt-1 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferenciación */}
      <section className="border-t border-nexo-border bg-nexo-soft">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Un servicio pensado para cada tipo de empresa</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border-2 border-nexo-accent bg-white p-8 shadow-sm">
              <div className="text-sm font-bold text-nexo-accent">NEXODIRECTO</div>
              <h3 className="mt-2 text-xl font-bold text-nexo">Autogestión, contacto directo</h3>
              <p className="mt-3 text-slate-600">
                Para negocios más chicos que quieren valuar y vender por su cuenta. Vos cargás la
                información, nosotros te damos la orientación y las herramientas.
              </p>
            </div>
            <div className="rounded-xl border border-nexo-border bg-white p-8">
              <div className="text-sm font-semibold text-slate-500">SERVICIO FULL</div>
              <h3 className="mt-2 text-xl font-bold text-nexo">Intermediación profesional</h3>
              <p className="mt-3 text-slate-600">
                Para operaciones que necesitan acompañamiento: información verificada, un asesor
                dedicado y gestión completa de la venta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-nexo-border bg-white">
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
