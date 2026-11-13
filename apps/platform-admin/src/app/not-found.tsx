import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-slate-600">404 · Admin portal</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-lg text-base text-slate-600">This administration route is unavailable. Return to the secure staff sign-in page.</p>
      <Link href="/login" className="mt-8 rounded-xl bg-[#003F5C] px-6 py-3 font-semibold text-white hover:bg-[#002B40]">Go to staff sign in</Link>
    </main>
  );
}
