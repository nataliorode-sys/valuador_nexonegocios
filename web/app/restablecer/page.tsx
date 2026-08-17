"use client";

import { useActionState } from "react";
import Link from "next/link";
import { use } from "react";
import { restablecer } from "./actions";

export default function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const sp = use(searchParams);
  const [msg, action, pending] = useActionState(restablecer, undefined);
  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";
  const ok = msg === "OK";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-nexo">Creá tu nueva contraseña</h1>

      {ok ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          ¡Listo! Tu contraseña se actualizó.{" "}
          <Link href="/ingresar" className="font-semibold underline">Ingresá ahora</Link>.
        </div>
      ) : (
        <form action={action} className="mt-8 space-y-4">
          <input type="hidden" name="uid" value={sp.uid ?? ""} />
          <input type="hidden" name="token" value={sp.token ?? ""} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input name="password" type="password" required minLength={6} className={inp} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Repetí la contraseña</label>
            <input name="password2" type="password" required minLength={6} className={inp} placeholder="Volvé a escribirla" />
          </div>
          {msg && !ok && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
            {pending ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      )}
    </main>
  );
}
