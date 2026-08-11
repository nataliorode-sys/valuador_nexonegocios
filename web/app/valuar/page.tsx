import Link from "next/link";
import { iniciarValuacion } from "./actions";
import { FAMILIAS } from "@/lib/wizard/steps";

// S5 — Elegibilidad. Al enviar, crea la valuacion y entra al wizard.
export default function ElegibilidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-nexo">← Volver</Link>
      <h1 className="mt-4 text-3xl font-bold text-nexo">Empecemos por lo básico</h1>
      <p className="mt-2 text-slate-600">
        Un par de preguntas para entender tu negocio. Después vas a poder cargar todo paso a paso y
        guardar tu avance.
      </p>

      <form action={iniciarValuacion} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">¿A qué se dedica tu empresa?</label>
          <select name="familia" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Elegí una opción…</option>
            {FAMILIAS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">¿La empresa está funcionando hoy?</label>
          <select name="enMarcha" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="si">Sí, está en marcha</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">¿Hace cuántos años opera?</label>
          <input name="antiguedad" type="number" min={0} required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="6" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Facturación anual aproximada</label>
          <select name="facturacionRango" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Preferís no decir</option>
            <option value="lt_50m">Menos de $50M</option>
            <option value="50_300m">$50M – $300M</option>
            <option value="300_1000m">$300M – $1.000M</option>
            <option value="gt_1000m">Más de $1.000M</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">¿Tenés a mano ventas y costos?</label>
          <select name="datosMano" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="si">Sí</option>
            <option value="mas_o_menos">Más o menos</option>
            <option value="no">No, los busco después</option>
          </select>
        </div>

        <button type="submit" className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark">
          Continuar
        </button>
      </form>
    </main>
  );
}
