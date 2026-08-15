export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-nexo-soft border-t-nexo" />
      <p className="mt-4 font-medium text-slate-600">Estamos preparando tu valuación…</p>
      <p className="mt-1 text-sm text-slate-400">Puede tardar unos segundos.</p>
    </main>
  );
}
