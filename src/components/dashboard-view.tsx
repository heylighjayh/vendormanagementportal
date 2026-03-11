import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { CompanyLogo } from "@/components/company-logo";
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
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--portal-bg)] text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_100%)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 rounded-[1.35rem] border border-white/80 bg-white/85 p-3 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2 lg:flex-row lg:items-center lg:justify-between">
              <CompanyLogo />
              <div className="flex flex-wrap items-center gap-3">
                {currentUser ? (
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {currentUser.name ?? currentUser.email}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {currentUser.role}
                    </span>
                  </div>
                ) : null}
                <Link
                  href="/"
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Home
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                  {dashboard.eyebrow}
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {dashboard.title}
                </h1>
                <p className="max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  {dashboard.description}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[1rem] border border-slate-200 bg-white p-3 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.45)]"
                >
                  <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600 sm:text-xs sm:leading-5">
                    {metric.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl flex-none gap-3 px-4 py-3 sm:px-6 xl:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="grid gap-4 md:grid-rows-2">
          <article className="flex min-h-0 flex-col rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-red)]">
              Queue
            </p>
            <div className="portal-scroll mt-2.5 space-y-2.5 pr-1">
              {dashboard.priorityQueue.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[0.95rem] border border-slate-200 bg-slate-50 p-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-slate-950">{item.title}</h2>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="flex min-h-0 flex-col rounded-[1.35rem] border border-slate-200 bg-slate-950 p-3 text-white shadow-[0_24px_60px_-55px_rgba(15,23,42,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Tasks
            </p>
            <div className="portal-scroll mt-2.5 space-y-2.5 pr-1">
              {dashboard.actions.map((action) => (
                <div
                  key={action.title}
                  className="rounded-[0.95rem] border border-white/10 bg-white/5 p-2.5"
                >
                  <h2 className="text-sm font-semibold">{action.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{action.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4 md:grid-rows-[0.95fr_1.05fr]">
          <article className="flex min-h-0 flex-col rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
              Updates
            </p>
            <div className="portal-scroll mt-2.5 grid gap-2.5 pr-1 md:grid-cols-2">
              {dashboard.alerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-[0.95rem] border border-slate-200 bg-slate-50 p-2.5"
                >
                  <h2 className="text-sm font-semibold text-slate-950">{alert.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{alert.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="flex min-h-0 flex-col rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-55px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
                  {dashboard.table.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {dashboard.table.description}
                </p>
              </div>
            </div>

            <div className="portal-scroll mt-2.5 overflow-x-auto pr-1">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    {dashboard.table.columns.map((column) => (
                      <th
                        key={column}
                        className="px-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.table.rows.map((row) => (
                    <tr key={row[0]} className="rounded-[1rem] bg-slate-50">
                      {row.map((cell) => (
                        <td key={cell} className="px-3 py-3 text-xs text-slate-700">
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
        <section className="mx-auto min-h-0 w-full max-w-7xl flex-1 px-4 pb-3 sm:px-6 lg:px-8">
          <div className="grid h-full min-h-0 gap-3 lg:grid-cols-2 auto-rows-[minmax(0,1fr)]">
            {children}
          </div>
        </section>
      ) : null}
    </main>
  );
}
