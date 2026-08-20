"use client";

import type { FieldDef, FormData } from "@/lib/wizard/types";

interface Props {
  field: FieldDef;
  data: FormData;
  error?: string;
  onChange: (id: string, value: FormData[string]) => void;
}

// Formatea con separador de miles es-AR; parsea a número entero.
const fmtMiles = (v: FormData[string]) =>
  v === undefined || v === "" ? "" : Number(v).toLocaleString("es-AR");
const parseMiles = (s: string): number | undefined => {
  const d = s.replace(/[^\d]/g, "");
  return d === "" ? undefined : Number(d);
};

export default function Field({ field, data, error, onChange }: Props) {
  const value = data[field.id];
  const inputClass =
    "mt-1 w-full rounded-lg border px-3 py-2 " +
    (error ? "border-red-400 bg-red-50" : "border-slate-300");

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>

      {field.type === "text" && (
        <input type="text" name={field.id} value={(value as string) ?? ""} placeholder={field.ejemplo}
          onChange={(e) => onChange(field.id, e.target.value)} className={inputClass} />
      )}

      {field.type === "textarea" && (
        <textarea name={field.id} value={(value as string) ?? ""} placeholder={field.ejemplo} rows={3}
          onChange={(e) => onChange(field.id, e.target.value)} className={inputClass} />
      )}

      {(field.type === "int" || field.type === "percent") && (
        <div className="relative">
          <input type="number" name={field.id} inputMode="decimal" value={value === undefined ? "" : (value as number)}
            placeholder={field.ejemplo} min={field.min} max={field.max}
            onChange={(e) => onChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
            className={inputClass + (field.type === "percent" ? " pr-12" : "")} />
          {/* pointer-events-none: el % no debe tapar las flechitas del spinner (si no, el clic para subir/bajar no funciona). */}
          {field.type === "percent" && <span className="pointer-events-none absolute right-8 top-2.5 text-slate-400">%</span>}
        </div>
      )}

      {field.type === "money" && (
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-slate-400">$</span>
          <input type="text" name={field.id} inputMode="numeric" value={fmtMiles(value)}
            placeholder={field.ejemplo}
            onChange={(e) => onChange(field.id, parseMiles(e.target.value))}
            className={inputClass + " pl-7"} />
        </div>
      )}

      {field.type === "moneyPeriod" && (
        <div className="mt-1 flex gap-2">
          <div className="relative w-full">
            <span className="absolute left-3 top-2.5 text-slate-400">$</span>
            <input type="text" name={field.id} inputMode="numeric" value={fmtMiles(value)}
              placeholder={field.ejemplo}
              onChange={(e) => onChange(field.id, parseMiles(e.target.value))}
              className={"w-full rounded-lg border pl-7 pr-3 py-2 " + (error ? "border-red-400 bg-red-50" : "border-slate-300")} />
          </div>
          <select name={`${field.id}Periodo`} value={(data[`${field.id}Periodo`] as string) ?? "mensual"}
            onChange={(e) => onChange(`${field.id}Periodo`, e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="mensual">/ mes</option>
            <option value="anual">/ año</option>
          </select>
        </div>
      )}

      {field.type === "select" && (
        <select name={field.id} value={(value as string) ?? ""} onChange={(e) => onChange(field.id, e.target.value)} className={inputClass}>
          <option value="">Elegí una opción…</option>
          {field.opciones?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {field.type === "bool" && (
        <div className="mt-2 flex gap-4">
          {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map((o) => (
            <label key={o.l} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.id} value={String(o.v)} checked={value === o.v}
                onChange={() => onChange(field.id, o.v)} />
              {o.l}
            </label>
          ))}
        </div>
      )}

      {field.type === "multiselect" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {field.opciones?.map((o) => {
            const arr = (value as string[]) ?? [];
            const sel = arr.includes(o.value);
            return (
              <button type="button" key={o.value}
                onClick={() =>
                  onChange(field.id, sel ? arr.filter((x) => x !== o.value) : [...arr, o.value])
                }
                className={
                  "rounded-full border px-3 py-1 text-sm " +
                  (sel ? "border-nexo bg-nexo text-white" : "border-slate-300 text-slate-600")
                }>
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {field.help && !error && <p className="mt-1 text-xs text-slate-500">{field.help}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
