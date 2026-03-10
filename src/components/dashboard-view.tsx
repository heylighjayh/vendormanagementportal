import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/auth";
import type { DashboardConfig } from "@/lib/portal-types";

export function DashboardView({
  dashboard,
  currentUser,
  children,
}: {
  dashboard: DashboardConfig;
  currentUser?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  children?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--portal-bg)] text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_90px_-52px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                  {dashboard.eyebrow}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {dashboard.title}
                </h1>
                <p className="text-base leading-7 text-slate-600 sm:text-lg">
                  {dashboard.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentUser ? (
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {currentUser.name ?? currentUser.email}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {currentUser.role}
                    </span>
                  </div>
                ) : null}
                <Link
                  href="/"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Home
                </Link>
                <Link
                  href="/architecture"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Architecture
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_26px_70px_-45px_rgba(15,23,42,0.45)]"
                >
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{metric.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-12 sm:px-8 xl:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-red)]">
              Priority queue
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.priorityQueue.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_80px_-55px_rgba(15,23,42,0.7)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Recommended actions
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.actions.map((action) => (
                <div
                  key={action.title}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <h2 className="text-base font-semibold">{action.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{action.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
              Email and workflow alerts
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {dashboard.alerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <h2 className="text-base font-semibold text-slate-950">{alert.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{alert.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                  {dashboard.table.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {dashboard.table.description}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {dashboard.table.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.table.rows.map((row) => (
                    <tr key={row[0]} className="rounded-[1.25rem] bg-slate-50">
                      {row.map((cell) => (
                        <td key={cell} className="px-4 py-4 text-sm text-slate-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>

      {children ? (
        <section className="mx-auto w-full max-w-7xl px-6 pb-16 sm:px-8 lg:px-12">
          {children}
        </section>
      ) : null}
    </main>
  );
}
