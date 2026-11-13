import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">404 · Page not found</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">This page has moved or doesn’t exist.</h1>
      <p className="mt-4 max-w-lg text-base text-slate-600">The link may be outdated, or the page may have been removed. Head back to TriFusion AI and continue from there.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="rounded-xl bg-[#003F5C] px-6 py-3 font-semibold text-white hover:bg-[#002B40]">Back to home</Link>
        <Link href="/login" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">Sign in</Link>
      </div>
    </main>
  );
}
