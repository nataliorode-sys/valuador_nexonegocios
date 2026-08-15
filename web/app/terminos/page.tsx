import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { EMPRESA, VERSION_LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de NexoDirecto (NexoNegocios).",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-nexo">Términos y Condiciones</h1>
        <p className="mt-1 text-sm text-slate-500">Vigencia: {EMPRESA.vigenciaDesde} · Versión {VERSION_LEGAL}</p>

        <div className="prose-legal mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-nexo">1. Quiénes somos</h2>
            <p>
              {EMPRESA.producto} es un servicio de {EMPRESA.nombreFantasia}, prestado por {EMPRESA.razonSocial},
              CUIT {EMPRESA.cuit}, con domicilio en {EMPRESA.domicilio}. Contacto: {EMPRESA.email}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">2. Objeto del servicio</h2>
            <p>
              {EMPRESA.producto} ofrece una <strong>orientación de valuación</strong> de empresas y fondos de
              comercio generada automáticamente a partir de la información que provee el usuario, y la
              posibilidad de <strong>publicar</strong> el negocio en venta en el Marketplace de {EMPRESA.nombreFantasia}
              con herramientas de difusión (informe, flyer). El servicio se contrata por un pago único.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">3. Naturaleza orientativa de la valuación</h2>
            <p>
              La valuación es una <strong>estimación orientativa y no vinculante</strong>. <strong>No constituye
              una tasación, pericia, auditoría ni asesoramiento financiero, legal o impositivo.</strong> Se basa
              en datos provistos por el usuario, <strong>no verificados</strong> por {EMPRESA.nombreFantasia} en
              cuanto a su exactitud. El valor real de una transacción depende de la negociación, la debida
              diligencia y las condiciones de mercado. {EMPRESA.nombreFantasia} <strong>no garantiza</strong> la
              venta del negocio ni un precio determinado, y no asume responsabilidad por las decisiones que el
              usuario o terceros tomen sobre la base de la orientación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">4. Precio, pago y facturación</h2>
            <p>
              El precio del servicio es de $150.000 ARS (precio final, IVA incluido), abonado a través de
              Mercado Pago. El importe se informa antes de contratar. Se emitirá el comprobante fiscal
              correspondiente conforme la normativa vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">5. Derecho de arrepentimiento y reembolsos</h2>
            <p>
              De acuerdo con el art. 34 de la Ley 24.240 y los arts. 1110-1111 del Código Civil y Comercial,
              el usuario consumidor puede <strong>revocar la contratación dentro de los 10 días corridos</strong>.
              Para ejercerlo, escribí a {EMPRESA.email}. Adicionalmente, si {EMPRESA.nombreFantasia} <strong>no
              aprueba la publicación</strong> del negocio en la moderación, se reintegra el pago. El usuario
              reconoce que, al solicitar la generación inmediata del informe, presta conformidad para que el
              servicio comience a ejecutarse; ello no limita los derechos que la ley le reconoce.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">6. Marketplace y contenido del usuario</h2>
            <p>
              El usuario es el único responsable por la veracidad de la información y de las fotos que publica,
              y declara tener derecho a ofrecerlas. {EMPRESA.nombreFantasia} verifica la <strong>existencia</strong>
              del negocio, no la exactitud de sus números. Está prohibido publicar contenido falso, ilícito, que
              infrinja derechos de terceros o que induzca a error. {EMPRESA.nombreFantasia} puede moderar,
              rechazar, pausar o remover publicaciones, y dar de baja avisos ante denuncias fundadas. Para
              reportar un aviso, escribí a {EMPRESA.email}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">7. Datos personales</h2>
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link href="/privacidad" className="text-nexo underline">Política de Privacidad</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">8. Limitación de responsabilidad</h2>
            <p>
              En la medida permitida por la ley, {EMPRESA.nombreFantasia} no será responsable por daños
              indirectos o lucro cesante derivados del uso del servicio o de la orientación de valuación. Nada
              de lo aquí dispuesto limita los derechos irrenunciables del consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-nexo">9. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia serán
              competentes {EMPRESA.jurisdiccion}, sin perjuicio de la jurisdicción que corresponda al consumidor
              conforme la normativa de defensa del consumidor.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link href="/privacidad" className="underline">Política de Privacidad</Link> ·{" "}
          <Link href="/" className="underline">Inicio</Link>
        </p>
      </main>
    </>
  );
}
