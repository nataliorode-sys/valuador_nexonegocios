"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ingresar } from "./actions";

export default function IngresarPage() {
  const [error, action, pending] = useActionState(ingresar, undefined);
  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-nexo">Ingresá</h1>
      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" required className={inp} placeholder="vos@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Contraseña</label>
          <input name="password" type="password" required className={inp} />
        </div>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        ¿No tenés cuenta? <Link href="/registro" className="text-nexo underline">Registrate</Link>
      </p>
    </main>
  );
}
