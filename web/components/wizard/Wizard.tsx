"use client";

import { useState, useTransition } from "react";
import { STEPS } from "@/lib/wizard/steps";
import { softWarnings, validateStep, visibleFields } from "@/lib/wizard/validation";
import type { FormData } from "@/lib/wizard/types";
import Field from "./Field";

interface Props {
  valuacionId: string;
  initialData: FormData;
  guardarPaso: (valuacionId: string, data: FormData) => Promise<{ ok: boolean }>;
  calcular: (valuacionId: string, data: FormData) => Promise<void>;
}

export default function Wizard({ valuacionId, initialData, guardarPaso, calcular }: Props) {
  const [data, setData] = useState<FormData>(initialData ?? {});
  const [stepIndex, setStepIndex] = useState(0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  const step = STEPS[stepIndex]!;
  const total = STEPS.length;
  const esUltimo = stepIndex === total - 1;
  const warnings = softWarnings(data);

  const onChange = (id: string, value: FormData[string]) => {
    setData((d) => ({ ...d, [id]: value }));
    setGuardado(false);
    setErrores((e) => {
      if (!e[id]) return e;
      const { [id]: _omit, ...rest } = e;
      return rest;
    });
  };

  const persistir = async (): Promise<void> => {
    setGuardando(true);
    await guardarPaso(valuacionId, data);
    setGuardando(false);
    setGuardado(true);
  };

  const siguiente = async () => {
    const errs = validateStep(step, data);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await persistir();
    if (esUltimo) {
      startTransition(() => {
        void calcular(valuacionId, data);
      });
    } else {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const atras = () => {
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const campos = visibleFields(step, data);
  const resumen = campos
    .filter((f) => data[f.id] !== undefined && data[f.id] !== "" && !(Array.isArray(data[f.id]) && (data[f.id] as string[]).length === 0))
    .map((f) => ({ label: f.label, valor: formatoResumen(data[f.id]) }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Paso {stepIndex + 1} de {total} · ~15 min</span>
          <span>
            {guardando ? "Guardando…" : guardado ? "Guardado ✓" : ""}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-nexo transition-all"
            style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{step.titulo}</h1>
      <p className="mt-1 text-slate-600">{step.descripcion}</p>

      {/* Campos */}
      <div className="mt-6 space-y-5">
        {campos.map((f) => (
          <Field key={f.id} field={f} data={data} error={errores[f.id]} onChange={onChange} />
        ))}
      </div>

      {/* Advertencias soft */}
      {warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              ⚠️ {w.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* Mini-resumen "lo que entendimos" */}
      {resumen.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Lo que entendimos</div>
          <dl className="mt-2 space-y-1 text-sm">
            {resumen.map((r, i) => (
              <div key={i} className="flex justify-between gap-4">
                <dt className="text-slate-500">{r.label}</dt>
                <dd className="text-right font-medium text-slate-700">{r.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Navegacion */}
      <div className="mt-8 flex items-center justify-between">
        <button onClick={atras} disabled={stepIndex === 0}
          className="rounded-lg px-4 py-2 text-slate-600 disabled:opacity-40">
          ← Atrás
        </button>
        <div className="flex items-center gap-3">
          <button onClick={persistir} className="text-sm text-slate-500 hover:text-nexo">
            Guardar y seguir después
          </button>
          <button onClick={siguiente} disabled={pending}
            className="rounded-lg bg-nexo px-6 py-2.5 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
            {esUltimo ? (pending ? "Calculando…" : "Calcular mi valuación") : "Siguiente →"}
          </button>
        </div>
      </div>
    </main>
  );
}

function formatoResumen(v: FormData[string]): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return v.toLocaleString("es-AR");
  return String(v);
}
