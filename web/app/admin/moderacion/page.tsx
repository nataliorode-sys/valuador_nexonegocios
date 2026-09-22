import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Ficha from "@/components/marketplace/Ficha";
import { requireAdmin } from "@/lib/session";
import { fmtUSD } from "@/lib/formato";
import { signOut } from "@/auth";
import { aprobarPublicacion, rechazarPublicacion, darDeBajaPublicacionAdmin, reactivarPublicacionAdmin } from "./actions";

export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, { t: string; c: string }> = {
  PUBLICADA: { t: "Publicada", c: "bg-emerald-100 text-emerald-800" },
  EN_REVISION: { t: "En revisión", c: "bg-amber-100 text-amber-800" },
  RECHAZADA: { t: "Rechazada", c: "bg-red-100 text-red-700" },
  PAGA: { t: "Pagada", c: "bg-slate-100 text-slate-600" },
  PUBLICACION_EN_ARMADO: { t: "Armando publicación", c: "bg-indigo-100 text-indigo-700" },
  CALCULADA: { t: "Valuación calculada (sin pagar)", c: "bg-sky-100 text-sky-700" },
  BORRADOR: { t: "En carga del formulario", c: "bg-slate-100 text-slate-500" },
};
const DAY = 86_400_000;

// Links de contacto (email + WhatsApp con mensaje prellenado) para reactivar a
// quienes empezaron la valuación y no avanzaron.
function waNumero(tel: string | null | undefined): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1); // saca el 0 nacional
  if (!d.startsWith("54")) d = "54" + d; // Argentina por defecto
  return d;
}

function mensajeContacto(nombre?: string | null): string {
  const hola = nombre ? `Hola ${nombre}` : "Hola";
  return `${hola}, soy del equipo de NexoNegocios. Vimos que empezaste la valuación de tu empresa en NexoDirecto y quedó a un paso. ¿Te ayudo a terminarla? El informe completo y la publicación tienen un precio de $35.000.`;
}

function ContactoLinks({ nombre, email, telefono }: { nombre?: string | null; email?: string | null; telefono?: string | null }) {
  const texto = mensajeContacto(nombre);
  const wa = waNumero(telefono);
  if (!email && !wa) return <span className="text-xs text-slate-300">sin contacto</span>;
  return (
    <span className="flex items-center justify-end gap-3 text-xs">
      {email && (
        <a href={`mailto:${email}?subject=${encodeURIComponent("Tu valuación en NexoDirecto")}&body=${encodeURIComponent(texto)}`} className="text-nexo underline">✉ Email</a>
      )}
      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener" className="text-emerald-600 underline">WhatsApp</a>
      )}
    </span>
  );
}

// Links al informe (respuestas + resultados) para el moderador. Solo si ya hay
// resultado calculado; el admin puede abrirlo aunque la valuación no esté paga.
function InformeLinks({ id, hasResultado }: { id: string; hasResultado: boolean }) {
  if (!hasResultado) return <span className="text-xs text-slate-300">sin cálculo aún</span>;
  return (
    <span className="flex items-center justify-end gap-3 text-xs">
      <Link href={`/valuar/${id}/informe`} target="_blank" className="text-nexo underline">Ver informe</Link>
      <a href={`/api/informe/${id}/pdf`} target="_blank" rel="noopener" className="text-slate-500 underline">PDF</a>
    </span>
  );
}

// A1 — Cola de moderación + tablero de publicaciones. Solo ADMIN.
export default async function ModeracionPage() {
  await requireAdmin();
  const pendientes = await prisma.valuacion.findMany({
    where: { estado: "EN_REVISION" },
    include: { publicacion: true },
    orderBy: { updatedAt: "asc" },
  });

  // Valuaciones en proceso: cargando el formulario o ya calculadas/pagas pero
  // que todavía no llegaron a la cola de revisión ni se publicaron.
  const enProceso = await prisma.valuacion.findMany({
    where: { estado: { in: ["BORRADOR", "CALCULADA", "PAGA", "PUBLICACION_EN_ARMADO"] } },
    include: {
      user: { select: { email: true, nombre: true, telefono: true } },
      resultado: { select: { valorCentralUsd: true } },
      perfil: { select: { familia: true, provincia: true, localidad: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Tablero: todas las publicaciones que llegaron a armarse, con métricas.
  const publicaciones = await prisma.publicacion.findMany({
    include: {
      _count: { select: { leads: true, denuncias: true } },
      valuacion: { select: { estado: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const ahora = Date.now();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/panel" className="text-slate-500 hover:text-nexo">← Mi panel</Link>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:text-nexo">Salir</button>
        </form>
      </div>
      <h1 className="text-2xl font-bold text-nexo">Moderación · cola de revisión</h1>
      <p className="mt-1 text-sm text-slate-500">{pendientes.length} publicación(es) esperando aprobación.</p>

      {pendientes.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          No hay publicaciones pendientes.
        </div>
      )}

      <div className="mt-6 space-y-6">
        {pendientes.map((v) => {
          const p = v.publicacion!;
          const aprobar = aprobarPublicacion.bind(null, p.id);
          const rechazar = rechazarPublicacion.bind(null, p.id);
          const verif = (p.datosVerificacion as { cuit?: string; googleUrl?: string; redesUrl?: string; webUrl?: string } | null) ?? {};
          const provistos = [verif.cuit, verif.googleUrl, verif.redesUrl, verif.webUrl].filter(Boolean).length;
          return (
            <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">{p.codigo}</div>
                <InformeLinks id={v.id} hasResultado />
              </div>
              <Ficha p={p} />

              {/* Datos de verificación provistos por el dueño */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Datos aportados por el dueño</div>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (provistos >= 2 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                    {provistos}/4 aportados
                  </span>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <VerifRow k="CUIT" v={verif.cuit} />
                  <VerifRow k="Ficha de Google" v={verif.googleUrl} link />
                  <VerifRow k="Redes sociales" v={verif.redesUrl} link />
                  <VerifRow k="Sitio web" v={verif.webUrl} link />
                </dl>
                {provistos < 2 && (
                  <p className="mt-2 text-xs text-amber-700">
                    ⚠️ El dueño aportó menos de 2 datos. Revisá con más cuidado antes de aprobar.
                  </p>
                )}
              </div>

              <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <form action={aprobar} className="rounded-lg bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-800">Verificación de existencia</div>
                  <p className="mt-1 text-xs text-emerald-700">Tildá lo que pudiste comprobar. Regla: al menos 2 de 4.</p>
                  <div className="mt-2 space-y-1 text-sm text-emerald-900">
                    <label className="flex items-center gap-2"><input type="checkbox" name="cuit" /> CUIT / existencia fiscal</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="google" /> Ficha de Google</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="redes" /> Redes sociales</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="web" /> Sitio web</label>
                  </div>
                  <button className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
                    Aprobar y publicar
                  </button>
                </form>

                <form action={rechazar} className="rounded-lg bg-red-50 p-4">
                  <div className="text-sm font-semibold text-red-800">Rechazar</div>
                  <textarea name="motivo" rows={4} placeholder="Motivo del rechazo…"
                    className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm" />
                  <button className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
                    Rechazar (con reembolso)
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Valuaciones en proceso (funnel, aún no publicadas ni en revisión) */}
      <h2 className="mt-12 text-xl font-bold text-nexo">Valuaciones en proceso</h2>
      <p className="mt-1 text-sm text-slate-500">
        {enProceso.length} en curso · en carga del formulario, calculadas o pagas sin llegar a revisión.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Valuación</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Valor central</th>
              <th className="px-3 py-2">Actualizada</th>
              <th className="px-3 py-2 text-right">Contactar</th>
              <th className="px-3 py-2 text-right">Informe</th>
            </tr>
          </thead>
          <tbody>
            {enProceso.map((v) => {
              const est = ESTADO_LABEL[v.estado] ?? { t: v.estado, c: "bg-slate-100 text-slate-600" };
              const rubro = v.perfil?.familia ?? "—";
              const ubic = [v.perfil?.localidad, v.perfil?.provincia].filter(Boolean).join(", ");
              return (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{rubro}{ubic ? ` · ${ubic}` : ""}</div>
                    <div className="text-xs text-slate-400">{v.codigo}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <div>{v.user?.nombre ?? "—"}</div>
                    <div className="text-xs text-slate-400">{v.user?.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + est.c}>{est.t}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                    {v.resultado ? fmtUSD(v.resultado.valorCentralUsd) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{v.updatedAt.toLocaleDateString("es-AR")}</td>
                  <td className="px-3 py-2 text-right"><ContactoLinks nombre={v.user?.nombre} email={v.user?.email} telefono={v.user?.telefono} /></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <InformeLinks id={v.id} hasResultado={!!v.resultado} />
                      <Link href={`/admin/valuacion/${v.id}`} className="text-xs text-nexo underline">Editar datos</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {enProceso.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">No hay valuaciones en proceso.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tablero de publicaciones */}
      <h2 className="mt-12 text-xl font-bold text-nexo">Todas las publicaciones</h2>
      <p className="mt-1 text-sm text-slate-500">{publicaciones.length} en total · estado y métricas de cada una.</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Publicación</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Vistas</th>
              <th className="px-3 py-2 text-right">Días</th>
              <th className="px-3 py-2 text-right">Consultas</th>
              <th className="px-3 py-2 text-right">Denuncias</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {publicaciones.map((p) => {
              const est = ESTADO_LABEL[p.valuacion?.estado ?? ""] ?? { t: p.valuacion?.estado ?? "—", c: "bg-slate-100 text-slate-600" };
              const vencida = !!p.fechaVencimiento && p.fechaVencimiento.getTime() < ahora;
              const diasPub = p.fechaPublicacion ? Math.floor((ahora - p.fechaPublicacion.getTime()) / DAY) : null;
              const diasRest = p.fechaVencimiento && !vencida ? Math.ceil((p.fechaVencimiento.getTime() - ahora) / DAY) : null;
              const publicada = p.valuacion?.estado === "PUBLICADA" && !vencida;
              const live = p.valuacion?.estado === "PUBLICADA" && p.estadoPub === "PUBLICADA" && !vencida;
              const pausadaDueno = p.valuacion?.estado === "PUBLICADA" && p.estadoPub === "PAUSADA";
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{p.titulo}</div>
                    <div className="text-xs text-slate-400">{p.codigo}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + est.c}>
                      {vencida ? "Vencida" : pausadaDueno ? "Dada de baja" : est.t}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.vistas}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-600">
                    {diasPub != null ? `${diasPub}d` : "—"}
                    {diasRest != null && <span className="text-slate-400"> · quedan {diasRest}d</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p._count.leads}</td>
                  <td className={"px-3 py-2 text-right tabular-nums " + (p._count.denuncias > 0 ? "font-bold text-red-600" : "text-slate-400")}>
                    {p._count.denuncias}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {publicada && (
                        <Link href={`/empresa/${p.codigo}`} className="text-xs text-nexo underline">Ver</Link>
                      )}
                      {live && (
                        <form action={darDeBajaPublicacionAdmin.bind(null, p.id)}>
                          <button className="text-xs text-red-500 underline hover:text-red-700">Dar de baja</button>
                        </form>
                      )}
                      {pausadaDueno && !vencida && (
                        <form action={reactivarPublicacionAdmin.bind(null, p.id)}>
                          <button className="text-xs text-emerald-600 underline hover:text-emerald-800">Reactivar</button>
                        </form>
                      )}
                      <Link href={`/admin/valuacion/${p.valuacionId}`} className="text-xs text-nexo underline">Editar</Link>
                      <InformeLinks id={p.valuacionId} hasResultado />
                    </div>
                  </td>
                </tr>
              );
            })}
            {publicaciones.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">Todavía no hay publicaciones.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// Asegura que un dato de verificación cargado por el dueño abra como URL externa.
// Si no trae esquema (http/https), el navegador lo tomaría como ruta relativa del
// propio sitio (…/admin/loquesea) → 404. Le anteponemos https:// y codificamos espacios.
function urlExterna(v: string): string {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return "https://" + t.replace(/\s+/g, "");
}

function VerifRow({ k, v, link }: { k: string; v?: string; link?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium">
        {v
          ? link
            ? <a href={urlExterna(v)} target="_blank" rel="noopener noreferrer" className="text-nexo underline break-all">{v} ↗</a>
            : <span className="text-slate-700 break-all">{v}</span>
          : <span className="text-slate-300">no aportado</span>}
      </dd>
    </div>
  );
}
