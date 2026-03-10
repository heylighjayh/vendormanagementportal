import Link from "next/link";
import { CompanyLogo } from "@/components/company-logo";
import { authImplementationNotes, authProviders } from "@/lib/auth-options";
import { notificationBlueprint } from "@/lib/notification-plan";
import { recommendedStack } from "@/lib/portal-data";

const buildPhases = [
  {
    title: "Phase 1",
    detail: "Wire PostgreSQL, Prisma migrations, file uploads, and role-based authentication.",
  },
  {
    title: "Phase 2",
    detail: "Convert sample dashboards into live admin, vendor, approver, and internal control workspaces.",
  },
  {
    title: "Phase 3",
    detail: "Connect email delivery, automate reminders, and capture full approval audit events.",
  },
  {
    title: "Phase 4",
    detail: "Add SAP ByDesign export or sync adapters once the operational workflow has stabilized.",
  },
];

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[var(--portal-bg)] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <CompanyLogo />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                href="/dashboard/admin"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Admin dashboard
              </Link>
            </div>
          </div>

          <div className="max-w-4xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--portal-blue)]">
              Architecture
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A practical stack for a lightweight, modular, and easy-to-maintain vendor portal
            </h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              This build uses a single modern TypeScript codebase, keeps modules separated
              by concern, and leaves a clean path for Microsoft 365 sign-in, vendor email
              sign-in, email automation, and future SAP ByDesign integration.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-2">
          {recommendedStack.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
                {item.title}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{item.choice}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[linear-gradient(180deg,#eef5ff_0%,#ffffff_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-12 sm:px-8 lg:grid-cols-2 lg:px-12">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-red)]">
              Authentication design
            </p>
            <div className="mt-5 space-y-4">
              {authProviders.map((provider) => (
                <div
                  key={provider.name}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <h2 className="text-lg font-semibold text-slate-950">{provider.name}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">{provider.audience}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{provider.purpose}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              {authImplementationNotes.map((note) => (
                <p key={note} className="text-sm leading-6 text-slate-600">
                  {note}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-red)]">
              Notification blueprint
            </p>
            <div className="mt-5 space-y-4">
              {notificationBlueprint.map((notification) => (
                <div
                  key={notification.event}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <h2 className="text-lg font-semibold text-slate-950">{notification.event}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Recipients: {notification.recipients}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_30px_100px_-55px_rgba(15,23,42,0.9)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Delivery roadmap
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {buildPhases.map((phase) => (
              <article
                key={phase.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-semibold">{phase.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{phase.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
