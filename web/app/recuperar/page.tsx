"use client";

import { useActionState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { pedirReset } from "./actions";

export default function RecuperarPage() {
  const [msg, action, pending] = useActionState(pedirReset, undefined);
  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-nexo">¿Olvidaste tu contraseña?</h1>
      <p className="mt-1 text-slate-600">Dejanos tu email y te enviamos un enlace para crear una nueva.</p>
      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" required className={inp} placeholder="vos@email.com" />
        </div>
        {msg && <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">{msg}</p>}
        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/ingresar" className="text-nexo underline">Volver a ingresar</Link>
      </p>
    </main>
    </>
  );
}
