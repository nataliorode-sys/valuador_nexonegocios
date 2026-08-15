"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrar } from "./actions";

export default function RegistroPage() {
  const [error, action, pending] = useActionState(registrar, undefined);
  const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-nexo">Creá tu cuenta</h1>
      <p className="mt-1 text-slate-600">Para guardar tu avance y gestionar tu publicación.</p>
      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input name="nombre" className={inp} placeholder="Tu nombre" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" required className={inp} placeholder="vos@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Contraseña</label>
          <input name="password" type="password" required minLength={6} className={inp} placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Repetí la contraseña</label>
          <input name="password2" type="password" required minLength={6} className={inp} placeholder="Volvé a escribir tu contraseña" />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input name="acepto" type="checkbox" required className="mt-1" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="text-nexo underline">Términos y Condiciones</Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="text-nexo underline">Política de Privacidad</Link>.
          </span>
        </label>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-nexo px-6 py-3 font-semibold text-white hover:bg-nexo-dark disabled:opacity-60">
          {pending ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta? <Link href="/ingresar" className="text-nexo underline">Ingresá</Link>
      </p>
    </main>
  );
}
