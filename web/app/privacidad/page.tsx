import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { EMPRESA, VERSION_LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo NexoDirecto (NexoNegocios) trata tus datos personales. Ley 25.326.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-base font-semibold text-slate-500">Política de Privacidad</h1>
        <p className="mt-0.5 text-[10px] text-slate-400">Vigencia: {EMPRESA.vigenciaDesde} · Versión {VERSION_LEGAL}</p>

        <div className="mt-3 space-y-2 text-[11px] leading-snug text-slate-400 [&_a]:text-slate-500 [&_a]:underline">
          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">1. Responsable de la base de datos</h2>
            <p>
              {EMPRESA.razonSocial} (CUIT {EMPRESA.cuit}), domicilio {EMPRESA.domicilio}, es responsable del
              tratamiento de los datos personales recolectados a través de {EMPRESA.producto}. Consultas sobre
              privacidad: {EMPRESA.email}.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">2. Qué datos recolectamos</h2>
            <ul className="ml-4 list-disc space-y-0.5">
              <li><strong>De la cuenta:</strong> nombre, email y contraseña (almacenada cifrada).</li>
              <li><strong>Del negocio:</strong> datos económicos y operativos que cargás para la valuación.</li>
              <li><strong>De la publicación:</strong> descripción, fotos, datos de contacto y de verificación
                (CUIT, redes, web) que aportás.</li>
              <li><strong>De consultas (leads):</strong> si contactás a un vendedor, tu nombre y datos de contacto.</li>
              <li><strong>Técnicos:</strong> datos de uso necesarios para operar el servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">3. Para qué los usamos (finalidad)</h2>
            <p>
              Para prestar el servicio de valuación y publicación, gestionar tu cuenta y el pago, moderar
              publicaciones, poner en contacto a compradores y vendedores, y cumplir obligaciones legales.
              La base legal es la ejecución del contrato y tu consentimiento (Ley 25.326, arts. 5 y 6).
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">4. Cesión y proveedores</h2>
            <p>
              Cuando enviás una consulta a un vendedor, <strong>tus datos de contacto se comparten con ese
              vendedor</strong> con la finalidad de que pueda responderte. Utilizamos proveedores que procesan
              datos por nuestra cuenta (por ejemplo, procesador de pagos Mercado Pago, alojamiento y
              almacenamiento en la nube, y envío de emails), que pueden implicar transferencias
              internacionales con los recaudos legales correspondientes. No vendemos tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">5. Conservación</h2>
            <p>
              Conservamos los datos mientras exista la relación y durante los plazos legales aplicables; luego
              se eliminan o anonimizan.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">6. Tus derechos (ARCO)</h2>
            <p>
              Podés solicitar el <strong>acceso, rectificación, actualización y supresión</strong> de tus datos
              escribiendo a {EMPRESA.email}. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, órgano de control de
              la Ley 25.326, tiene la atribución de atender denuncias y reclamos. El titular de los datos puede
              ejercer el derecho de acceso en forma gratuita a intervalos no inferiores a seis meses.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold text-slate-500">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. Ningún sistema es
              100% infalible; te pedimos cuidar tu contraseña.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link href="/terminos" className="underline">Términos y Condiciones</Link> ·{" "}
          <Link href="/" className="underline">Inicio</Link>
        </p>
      </main>
    </>
  );
}
